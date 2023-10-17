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
    const queryText = `INSERT INTO orders(email, item, gesamtPreis, name,pickupdate,location) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [CustomerEmail, itemsDescription, totalAmount, customerName, mysqlFormattedDate, selectedLocation];

    pool.query(queryText, values, (err, res) => {
        if (err) {
            console.log("Mistake at insert in DB", err.stack);
        } else {
            console.log("Insert Sucessfull", res.affectedRows);


            const emailText = `
            <!DOCTYPE html>
<html>
<head>
  <style>
    /* Your CSS styles here */
    body {
      font-family: Arial, sans-serif;
      background-color: #f0f0f0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
    }
    .description {
        display:flex;
        flex-direction:column;
        justify-content:center; 
    }
  </style>
</head>
<body>
<div class="container">
  <div class="head">
   <img src="cid:logo" alt="logo" />
   </div>
    <h1>Vielen Dank für ihre bestellung!</h1>
    <p class="description">${itemsDescription}</p>
    <p>${totalAmount}</p> 
    <p>Ihre Bestellung ist am :${mysqlFormattedDate} von 08:00 - 13:00 bereit am ${selectedLocation} zum abholen </p>
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









