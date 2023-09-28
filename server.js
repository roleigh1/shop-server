require('dotenv').config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require("nodemailer");
const app = express();

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

// Middleware für den Checkout-Endpunkt
app.post('/create-checkout-session', bodyParser.json(), async (req, res) => {
    try {
        const warenkorb = req.body.warenkorb;
        if (!warenkorb) {
            return res.status(400).json({ error: 'Warenkorb nicht gefunden' });
        }
        const line_items = warenkorb.map(item => {
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name
                    },
                    unit_amount: item.price * 100,
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
app.post('/webhook', express.raw({ type: 'application/json'}), (request, response, ) => {
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
            const checkoutSessionCompleted = event.data.object;
           
            console.log("payment successfull");
            sendMail();
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    response.send();
});

function sendMail() {
    let mailOptions = {
        from: "robinl.leitner1@gmail.com",
        to: "robinl.leitner1@gmail.com",
        subject: "Bezahlung erfolgt",
        text: "Ihre Bezahlung wurde erfolgreich abgeschlossen"
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Fehler beim Senden der Email");
        } else {
            console.log("Email gesendet:", info.response);
        }
    });
}

app.get('/', (req, res) => {
    res.send('Willkommen zu meinem Express-Server!');
});

app.listen(4242, () => console.log('Running on port 4242'));









