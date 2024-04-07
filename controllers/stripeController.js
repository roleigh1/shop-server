
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Decimail = require('decimal.js'); 
const inserController = require('./insertController');

const Decimal = require('decimal.js');
const YOUR_DOMAIN = 'http://localhost:3000';

let selectedDate = null;
let selectedLocation;

const createCheckoutSession =   async (req, res) =>  {

    try {
        const cart = req.body.cart; 
      
        const selectLocation = req.body.selectLocation; 
        let pickupdate = req.body.selectedDate; 
        selectedDate = pickupdate.toString(); 

        selectedLocation =  selectLocation;

        if(!cart) {
            return res.status(400).json({ error: ' Cart not found'}); 
        }
    
        if(!selectLocation) {
            return res.status(400).json({ error: 'Location not selected'}); 
        } 
        if (!pickupdate) {
            return res.status(400).json({ error: `'Pickup Date not selected` })
        }
        console.log(selectedLocation); 
        console.log(selectedDate); 

        const line_items = cart.map(item => {
            const unitAmount = new Decimal(item.price).mul(100).toNumber();
            return {
                price_data: {
                    currency:'eur',
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
            mode:'payment',
            success_url: `${YOUR_DOMAIN}?success=true`,
            cancel_url:`${YOUR_DOMAIN}?canceled=true`,
           
        });
        res.json({ url: session.url });
  } catch (error) {
    console.error(`Error when creating the Checkout-Session `, error ); 
    return res.status(500).json({ error: error.message }); 
  }
}

const endpointSecret = process.env.ENDPOINT_SECRET; 

 
const handleWebhook = async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
    
                console.log("payment successfull");
    
                break;
    
            case "checkout.session.completed":
            try {
            const session = event.data.object;
            const customerEmail = session.customer_details.email;
            const customerName = session.customer_details.name;
            const totalAmount = session.amount_total / 100; 
    
    
            inserController.insertRecord(session,customerEmail,customerName,totalAmount,selectedLocation,selectedDate);
            console.log('inserted');
        
           } catch (error) {
            console.error('Error when inserting', error);
           }
             break; 
             default: 
                    console.log(`Unhandled event type ${event.type}`);
        }
    
        response.json({received: true});
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        console.error("Error", err);
    }
   
}


module.exports = {createCheckoutSession,handleWebhook}; 