const express = require('express'); 
const dataController = require('../controllers/dataController'); 
const stripeController = require("../controllers/stripeController"); 

const bodyParser = require('body-parser');

const router = express.Router(); 

router.get('/infos', dataController.getSeasonCards);
router.get('/products',dataController.getProducts);
router.get('/items' , dataController.getBestsellerItems); 
router.post('/create-checkout-session', bodyParser.json(),stripeController.createCheckoutSession);
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.handleWebhook);

module.exports = router;
