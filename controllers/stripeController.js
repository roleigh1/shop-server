const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeKey); 
const Decimail = require('decimal.js'); 
const inserController = require('./insertController');
const { Order } = require('../models'); 

const YOUR_DOMAIN = 'http://localhost:3000';

let selectedDate = null;
let selectedLocation;


const createCheckoutSession = async (req, res) =>  {
    try {
        const cart = req.body.cart; 
        const selectLocation = req.body.selectedLocation; 
        let pickupdate = req.body.selectedDate; 
        selectedDate = pickupdate.toString(); 

        selectedLocation =  selectLocation;

        if(!cart) {
            return res.status(400).json({ error: ' Cart not found'}); 
        }
    
        if(!selectLocation) {
            return res.status(400).json({ error: 'Pickup date is not selected '}); 
        } 
        console.log(selectLocation); 
        console.log(selectedDate); 

        const line_items = cart.map(item => {
            return {
                price_data: {
                    currency:'eur',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: unitAmout
                },
                quantity: item.quantity
            };
        })
        const session = await stripe.checkout.session.create({
            line_items,
            mode:'payment',
            success_url: `${YOUR_DOMAIN}?success=true`,
            cancel_url:`${YOUR_DOMAIN}?canceled=true`,
        })
  } catch (error) {
    console.error(`Error when creating the Checkout-Session `, error ); 
    return res.status(500).json({ error: error.message }); 
  }
}

const endpointSecret = process.env.ENDPOINT_SECRET;

function handleWebhook (request, response) {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        databaseOperations.insertRecord(session);
    } else {
        console.log(`Unhandled event type ${event.type}`);
    }

    response.json({received: true});
}


module.exports = {createCheckoutSession,handleWebhook}; 