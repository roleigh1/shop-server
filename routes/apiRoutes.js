const express = require('express'); 
const dataController = require('../controllers/dataController'); 
const stripeController = require("../controllers/stripeController"); 
const paginierung = require('../controllers/paginierung');
const bodyParser = require('body-parser');

const router = express.Router(); 

router.get('/infos', paginierung.getCardInfo);
router.get('/products',dataController.getProducts);
router.get('/items' , dataController.getBestsellerItems); 
router.post('/create-checkout-session', bodyParser.json(),stripeController.createCheckoutSession);
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.handleWebhook);

module.exports = router;
