require('dotenv').config();
const mysql = require("mysql");
const {google} = require('googleapis');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require("nodemailer");
const app = express();
const Decimal = require('decimal.js');
const config = require("./config");
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(config.clientId, config.clientSecret)
OAuth2_client.setCredentials({ refresh_token: config.refreshToken });



let selectedDate = null;
let selectedLocation;

app.use(express.static('C:\\Users\\Robin\\OneDrive\\Desktop\\react\\shop\\public'));

app.use(cors());

const YOUR_DOMAIN = 'http://localhost:3000';

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "shopDB"
});


app.post('/create-checkout-session', bodyParser.json(), async (req, res) => {
    try {
        const cart = req.body.cart;
        const selectLocation = req.body.selectLocation;
        let pickupdate = req.body.selectedDate;
        selectedDate = pickupdate.toString();
        selectedLocation = selectLocation;
        if (!cart) {
            return res.status(400).json({ error: 'Cart not found' });
        }

        if (!selectLocation) {
            return res.status(400).json({ error: 'Location not selected' });
        }
        if (!pickupdate) {
            return res.status(400).json({ error: `'Pickup Date not selected` })
        }
        console.log(selectedDate);
        console.log(selectedLocation);
        const line_items = cart.map(item => {
            const unitAmount = new Decimal(item.price).mul(100).toNumber();
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity
            };
        });


        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}?success=true`,
            cancel_url: `${YOUR_DOMAIN}?canceled=true`,

        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Fehler beim Erstellen der Checkout-Session:", error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

const endpointSecret = process.env.ENDPOINT_SECRET;

// Middleware für den Stripe Webhook-Endpunkt
app.post('/webhook', express.raw({ type: 'application/json' }), (request, response,) => {
    const sig = request.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;

            console.log("payment successfull");

            break;
        case "checkout.session.completed":
            const session = event.data.object;
            const customerEmail = session.customer_details.email;
            const customerName = session.customer_details.name;
            const totalAmount = session.amount_total / 100; // in Euros for example

            // To get the line items:
            stripe.checkout.sessions.listLineItems(session.id, function (err, lineItems) {
                if (err) {
                    console.error("Fehler beim Abrufen der Artikel:", err);
                } else {
                    insertSQL(customerEmail, customerName, totalAmount, lineItems.data, selectedDate, selectedLocation);
                }
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    response.send();
});
function insertSQL(CustomerEmail, customerName, totalAmount, lineItems, selectedDate, selectedLocation) {
    const itemsDescription = lineItems.map(item => `${item.description}:${item.quantity}`).join(", ");
    const mysqlFormattedDate = new Date(selectedDate).toISOString().split('T')[0];
    const queryText = `INSERT INTO orders(email, item, gesamtPreis, name, pickupdate, location) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [CustomerEmail, itemsDescription, totalAmount, customerName, mysqlFormattedDate, selectedLocation];

    pool.query(queryText, values, (err, res) => {
        if (err) {
            console.log("Mistake at insert in DB", err.stack);
        } else {
            console.log("Insert Successful", res.affectedRows);

            const tableRows = lineItems.map((item, index) => `
                <tr>
              
                    <td>${item.description}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price * item.quantity}</td>
                </tr>
            `).join('');

            const emailText = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f7f7f7;">
            
                <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: 40px auto; text-align: center;">
            
                    <img class="logo" src="https://i.ibb.co/LZCgP2X/logo.png" />
                    <h2 style="color: #333;">Vielen Dank für ihre Bestellung</h2>
            
                    <section style="margin: 20px 0;">
                        <div>
                            <strong>Rechnungsdaten</strong><br>
                            ${customerName}<br>
                            ${CustomerEmail}
                        </div>
                    </section>
            
                    <section style="margin: 20px 0;">
                        <strong>Ihre Bestellung ist am ${mysqlFormattedDate}</strong><br>
                        am ${selectedLocation} von 07-12:00 zum abholen bereit.
                    </section>
            
                    <table style="width: 100%; margin: 20px 0; border-collapse: collapse; text-align: left;">
                        <tr>
                            <th>Artikelnummer</th>
                            <th>Artikelname</th>
                            <th>Preis</th>
                            <th>Anzahl</th>
                            <th>Gesamtpreis</th>
                        </tr>
                        ${tableRows}
                    </table>
                    <strong>Gesamtpreis: € ${totalAmount}</strong>
            
                    <section style="margin: 20px 0;">
                        <h3 style="color: #333;">Gärtnerei Leitner: Frisches Gemüse für Wiens Märkte</h3>
                        <p>Mitten im Herzen von Simmering, einem lebhaften Bezirk in Wien, blüht eine besondere Gärtnerei. Hier, geschützt von der Hektik der Stadt, wachsen knackige Salate, aromatische Kräuter und bunte Gemüsesorten, die jeden Gaumen be
            
                        <p>Mitten im Herzen von Simmering, einem lebhaften Bezirk in Wien, blüht eine besondere Gärtnerei. Hier, geschützt von der Hektik der Stadt, wachsen knackige Salate, aromatische Kräuter und bunte Gemüsesorten, die jeden Gaumen begeistern.</p>
                    </section>
            
                    <footer style="margin-top: 20px;">
                        <div style="text-align: center;">
                        
                            <div>
                                <strong>Contact</strong>
                                <p>Vienna, Vie 1110, AT</p>
                                <p>info@GaertnereiLeitner.com</p>
                                <p>+01 234 567 88</p>
                                <p>+01 234 567 89</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
            </html>
            


            `;
            sendMail(CustomerEmail, emailText);
        }
    });
}


function sendMail(CustomerEmail, emailText) {
    const accesToken = OAuth2_client.getAccessToken()


    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: config.user,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken,
            accessToken: accesToken

        }
    });

    let mailOptions = {
        from: "robinl.leitner1@gmail.com",
        to: CustomerEmail,
        subject: "Bestellung bei Gärtnerei Leitner",
        html: emailText,
        attachments: [{
            filename: 'logo.png',
            path: './logo.png',
            cid: 'logo'
        }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Email gesendet:", info.response);
        }
    });
}

app.get('/', (req, res) => {
    res.send('Willkommen zu meinem Express-Server!');
});

app.listen(4242, () => console.log('Running on port 4242'));









