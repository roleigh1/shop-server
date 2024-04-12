const nodemailer = require("nodemailer");
const config = require("../config");
const { google } = require("googleapis");
const { decrypt } = require("dotenv");
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(config.clientId, config.clientSecret);
OAuth2_client.setCredentials({ refresh_token: config.refreshToken });

function generateEmailTemplate(order, lineItems) {
  console.log(lineItems, "inEmail");
  let mysqlFormattedDate = new Date(order.dataValues.pickupdate)
    .toISOString()
    .split("T")[0];
  const [year, month, day] = mysqlFormattedDate.split("-");

  const tableRows = lineItems.data.map((item) => {
      return `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>€ ${(item.price.unit_amount / 100).toFixed(2)}</td>
                <td>€ ${(
                  (item.price.unit_amount / 100) *
                  item.quantity
                ).toFixed(2)}</td>
            </tr>
        `;
    })
    .join("");

  // Email template
  const emailText = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        <title>Email Template</title>
    </head>
    <body style="font-family: "Montserrat", sans-serif; margin: 0; padding: 20px; background-color: #f7f7f7;">
    
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: 40px auto; text-align: center;">
    
            <img class="logo" src="https://i.ibb.co/LZCgP2X/logo.png" />
            <h2 style="color: #333;">Vielen Dank für ihre Bestellung</h2>
    
            <section style="margin: 20px 0;">
                <div>
                    <strong>Rechnungsdaten</strong><br>
                    Bestellnummer:${order.dataValues.id}<br>
                    ${order.dataValues.email}
                </div>
            </section>
    
            <section style="margin: 20px 0;">
                <strong>Ihre Bestellung ist am ${day}-${month}-${year}<br>
                bei unseren Stand auf dem ${order.dataValues.location} von 07-12:00 zum abholen bereit.</strong>
              
            </section>
            <hr size="1.5px" color="black" />
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; text-align: center;">
                <tr>
              
                    <th>Artikelname</th>
                    <th>Anzahl</th>
                    <th>Preis</th>
                    <th>Gesamtpreis</th>
                </tr>
                ${tableRows}
            </table>
            <strong>Gesamtpreis: € ${order.dataValues.total}</strong>
            <hr size="1.5px" color="black" />
            <footer style="margin-top: 20px;">
            <section style="margin: 20px 0;">
                <h3 style="color: #333;">Gärtnerei Leitner: Frisches Gemüse für Wiens Märkte</h3>
                <p>Mitten im Herzen von Simmering, einem lebhaften Bezirk in Wien, blüht eine besondere Gärtnerei. Hier, geschützt von der Hektik der Stadt, wachsen knackige Salate, aromatische Kräuter und bunte Gemüsesorten, die jeden Gaumen be
    
                <p>Mitten im Herzen von Simmering, einem lebhaften Bezirk in Wien, blüht eine besondere Gärtnerei. Hier, geschützt von der Hektik der Stadt, wachsen knackige Salate, aromatische Kräuter und bunte Gemüsesorten, die jeden Gaumen begeistern.</p>
            </section>
         
            
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

  return emailText;
}

function sendConfirmationEmail(customerEmail, order, lineItems) {

    const accessToken = process.env.ACCESS_TOKEN;
    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: config.user,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      accessToken: accessToken,
    },
  });

  const emailText = generateEmailTemplate(order, lineItems);

  const mailOptions = {
    from: "robinl.leitner1@gmail.com",
    to: customerEmail,
    subject: "Bestellung bei Gärtnerei Leitner",
    html: emailText,
    attachments: [
      {
        filename: "logo.png",
        path: "./logo.png",
        cid: "logo",
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
function sendContactMail (req,res){
  try{
    const { details } = req.body; 
    console.log(details); 
    const accessToken = process.env.ACCESS_TOKEN;
    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: config.user,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      accessToken: accessToken,
    },
  });
  const mailOptions = {
    from: "robinl.leitner1@gmail.com",
    to: "robinl.leitner1@gmail.com",
    subject: "Contact reqest",
    html: `<p>Name: ${details.name}</p>
    <p>Email: ${details.email}</p>
    <p>Message: ${details.message}</p>`,
    attachments: [
      {
        filename: "logo.png",
        path: "./logo.png",
        cid: "logo",
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
    res.status(200).json({message: "sent"})
  } catch (error){
    res.status(400).json({message:"not send!"})
    console.error(error,"error in sendContactMail");
  }

  
}

module.exports = { sendConfirmationEmail ,sendContactMail };
