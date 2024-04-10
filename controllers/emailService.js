const nodemailer = require('nodemailer');
const config = require('../config');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2; 

const OAuth2_client = new OAuth2(config.clientId, config.clientSecret); 
OAuth2_client.setCredentials({ refresh_token: config.refreshToken });

function generateEmailTemplate(order,lineItems) {
  
    const { id,customerName, customerEmail, totalAmount, selectedDate, selectedLocation } = order;
    console.log(order,"inEmail");
    //const mysqlFormattedDate = new Date(selectedDate).toISOString().split('T')[0];

    
  
    const tableRows = lineItems.data.map(item => {
        return `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>€ ${(item.price.unit_amount / 100).toFixed(2)}</td>
                <td>€ ${(item.price.unit_amount / 100 * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // Email template
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
                    Bestellnummer:${id}<br>
                    ${customerName}<br>
                    ${customerEmail}
                </div>
            </section>
    
            <section style="margin: 20px 0;">
                <strong>Ihre Bestellung ist am ${/*mysqlFormattedDate*/"test"}<br>
                bei unseren Stand auf dem ${selectedLocation} von 07-12:00 zum abholen bereit.</strong>
              
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
            <strong>Gesamtpreis: € ${totalAmount}</strong>
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
    ` ;

   return emailText;
    
}

function sendConfirmationEmail(customerEmail, order, OAuth2_client,lineItems) {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: config.user,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken,
            accessToken: "ya29.a0Ad52N39anQvIEsI7GP91G0ygK_2hBFIml0SdgwN56UlpBiRKM488uL77yt8RBjX6kN4tFu0fkHHfRUacJVMY0KCnW3w-E9fI-HbZPJ1EWl940MCRaMDjwubJVy97U5G9ddz4ZeVwX-vrZLP4AKiYm5Lbi-NtcNSUILmzaCgYKAcUSARISFQHGX2MiI6oge9Y4RQzMVdw3frpEtg0171"//accessToken
        }
    });

    const emailText = generateEmailTemplate(order,lineItems);

    const mailOptions = {
        from: "robinl.leitner1@gmail.com",
        to: customerEmail,
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
            console.log("Email sent:", info.response);
        }
    });
}

module.exports = { sendConfirmationEmail };
