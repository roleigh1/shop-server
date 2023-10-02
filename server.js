require('dotenv').config();
const mysql = require("mysql");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require("nodemailer");
const app = express();
const Decimal = require('decimal.js');

app.use(express.static('C:\\Users\\Robin\\OneDrive\\Desktop\\react\\shop\\public'));
app.use(cors());

const YOUR_DOMAIN = 'http://localhost:3000';

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "shopDB"
});


// Middleware für den Checkout-Endpunkt
app.post('/create-checkout-session', bodyParser.json(), async (req, res) => {
    try {
        const warenkorb = req.body.warenkorb;
        if (!warenkorb) {
            return res.status(400).json({ error: 'Warenkorb nicht gefunden' });
        }
        const line_items = warenkorb.map(item => {
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
                    insertSQL(customerEmail, customerName, totalAmount, lineItems.data);
                }
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    response.send();
});
function insertSQL(CustomerEmail, customerName, totalAmount, lineItems) {
    const itemsDescription = lineItems.map(item => `${item.description}:${item.quantity}`).join(", ");
    const queryText = `INSERT INTO orders(email, item, gesamtPreis, name) VALUES (?, ?, ?, ?)`;
    const values = [CustomerEmail, itemsDescription, totalAmount, customerName];

    pool.query(queryText, values, (err, res) => {
        if (err) {
            console.log("Mistake at insert in DB", err.stack);
        } else {
            console.log("Insert Sucessfull", res.affectedRows);


            const emailText = `Vielen Dank für Ihre Bestellung: ${itemsDescription}. Gesamtpreis: ${totalAmount}€`;
            sendMail(CustomerEmail, emailText);
        }
    });
}


function sendMail(CustomerEmail, emailText) {
    let mailOptions = {
        from: "robinl.leitner1@gmail.com",
        to: CustomerEmail,
        subject: "Bestellung bei Gärtnerei Leitner",
        text: emailText
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









