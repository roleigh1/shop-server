const emailService = require('./emailService');
const { Order } = require('../models'); 

async function insertRecord(session) {
    const customerEmail = session.customer_details.email;
    const customerName = session.customer_details.name;
    const totalAmount = session.amount_total / 100;
    const selectedDate = session.metadata.selectedDate;
    const selectedLocation = session.metadata.selectedLocation;

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
                console.log('Order inserted', order);
              //  emailService.sendConfirmationEmail(customerEmail, order);
            } catch (error) {
                console.error('Error when inserting', error);
            }
        }
    });
}

module.exports = { insertRecord };
