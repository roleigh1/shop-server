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
  .head {
    display:flex; 
    text-align: center;
    justify-content:center;
    flex-direction:column;
    align-items:center;
  }
  .logo {
    width:8rem;
      margin-top:1rem;
  
  }
  h2{
    text-align: center;
    margin-top:3rem;
  }
  .cu_data {
    display: flex;
    flex-direction: row;
    justify-content:center;
    align-items:center;
    gap:5rem
  }
  .data_one {
    display: flex;
    flex-direction: column;
    justify-content:center;
    align-items:center;
  }
  
  .data_one h4 {
    margin-bottom: 2px;
  }
  
  .data_one p {
    margin: 0;
    margin-bottom: 2px;
  }
  .table {
    display:flex;
    justify-content:center;
    margin-top:2rem
    
  }
   th, td {
      
      padding: 1rem;
      text-align: left;
    }
  
  
  .total {
    display:flex;
    justify-content:center;
  }
  footer {
      font-family: Arial, sans-serif;
      padding: 20px 0;
      background-color: #f9f9f9;
  }
  
  .footer-container {
      display: flex;
      justify-content: space-between;
      padding: 0 5%;
  }
  
  .footer-section {
      flex: 1;
      padding: 0 20px;
  }
  
  .footer-section h4 {
      margin-top: 0;
  }
  
  .footer-section ul {
      list-style: none;
      padding: 0;
  }
  
  .footer-section ul li {
      margin-bottom: 5px;
  }
  
  .footer-bottom {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
  }
  </style>
</head>
<body>
<div class="head">
<img class="logo" src="https://i.ibb.co/LZCgP2X/logo.png"  />
  <h2>Vielen Dank für ihre Bestellung</h2>
 
</div>
<hr color="black" size="1px" width='80%' />
<div class="cu_data">
  <div class="data_one">
   <h4>Rechnungsdaten</h4>
    <p>Max Mustermann</p>
    <p>Maxmuster@web.de<p> 
  </div>
  <div class="data_one"> 
  <h4>Abhol infos</h4>
    <p>Karmelitermarkt</p>
    <p>2011-01-01<p>
  </div>
  
</div> 
<table class="table">
  <tr>
    <th>Artikelnummer</th>
    <th>Artikelname</th>
    <th>Preis</th>
    <th>Anzahl</th>
    <th>Gesamtpreis</th>
  </tr>
  <tr>
    <td>1</td>
    <td>T-Shirt</td>
    <td>20,00 €</td>
    <td>2</td>
    <td>40,00 €</td>
  </tr>
  <tr>
    <td>2</td>
    <td>Jeans</td>
    <td>50,00 €</td>
    <td>1</td>
    <td>50,00 €</td>
  </tr>
  
  <tr>
    <td>3</td>
    <td>Schuhe</td>
    <td>80,00 €</td>
    <td>1</td>
    <td>80,00 €</td>
  </tr>

</table>

<hr color="black" size="1px" width='80%' />
<div class="total">
  <p>Gesamtpreis:</p>
  <p> € 177.00</p>
</div>
<footer>
    <div class="footer-container">
        <div class="footer-section">
            <h4>Gärtnerei Leitner: Frisches Gemüse für Wiens Märkte</h4>
            <p>Mitten im Herzen von Simmering, einem lebhaften Bezirk in Wien, blüht eine besondere Gärtnerei. Hier, geschützt von der Hektik der Stadt, wachsen knackige Salate, aromatische Kräuter und bunte Gemüsesorten, die jeden Gaumen begeistern.</p>
        </div>
        <div class="footer-section">
            <h4>Useful links</h4>
            <ul>
                <li>Products</li>
                <li>Contact us</li>
                <li>Impressum</li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Contact</h4>
            <ul>
                <li>🏠 Vienna, Vie 1110, AT</li>
                <li>📧 info@GaertnereiLeitner.com</li>
                <li>📞 +01 234 567 88</li>
                <li>📠 +01 234 567 89</li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        Developed @RoLeigh
    </div>
</footer>

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









