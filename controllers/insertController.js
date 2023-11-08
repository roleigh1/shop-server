const emailService = require('./emailService');
const { Order } = require('../models/models'); 
const stripe = require('stripe')('sk_test_51NpahnKW38JNXmg0k5GZ56wkE44G9ldI0xZMvm2NHuIbQP8WM7IdvsRKg2oAIpnySrB24bKclSj0H6DGsMQUmWPa00uwWcvMJv');



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
                    pickupdate:mysqlFormattedDate,
                    location:selectedLocation 
                });
                console.log('Order inserted', order);
              //  emailService.sendConfirmationEmail(customerEmail, order);
            } catch (error) {
                console.error('Error when inserting', error);
            }
        }
    });
    
}

module.exports = { insertRecord };
