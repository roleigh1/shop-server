const emailService = require('./emailService');
const { Order } = require('../models/models'); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { OAuth2_client } = require('../config');


async function insertRecord(session,customerEmail,customerName,totalAmount,selectedLocation,selectedDate) {
    console.log(customerEmail)
    console.log(customerName)
    console.log(totalAmount);
    console.log(selectedLocation);

    stripe.checkout.sessions.listLineItems(session.id, async function (err, lineItems) {
        if (err) {
            console.error("Error retrieving line items:", err);
        } else {
            const itemsDescription = lineItems.data.map(item => `${item.description}:${item.quantity}`).join(", ");
            const mysqlFormattedDate = new Date(selectedDate).toISOString().split('T')[0];
            try {
                const order = await Order.create({ 
                    email: customerEmail, 
                    item: itemsDescription, 
                    total: totalAmount, 
                    pickupdate: mysqlFormattedDate,
                    location: selectedLocation 
                });

                emailService.sendConfirmationEmail(customerEmail, order, lineItems); 
            } catch (error) {
                console.error('Error when inserting', error);
            }
        }
    });
}


module.exports = { insertRecord };
