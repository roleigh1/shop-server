const express = require('express'); 
const dataController = require('../controllers/dataController'); 
const stripeController = require("../controllers/stripeController"); 

const bodyParser = require('body-parser');

const router = express.Router(); 

router.get('/infos', dataController.getInfo);
router.get('/products',dataController.getItems);
router.get('/items' , dataController.getItems); 
router.post('/create-checkout-session', bodyParser.json(),stripeController.createCheckoutSession);
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.handleWebhook);

module.exports = router;
