const express = require('express'); 

const stripeController = require("../controllers/stripeController"); 
const fetchData = require("../controllers/dataFetchControllers");
const bodyParser = require('body-parser');

const router = express.Router(); 

router.get('/CardInfos', fetchData.getCardInfo);
router.get('/Products',fetchData.getProducts);
router.get('/BestsellerItems' , fetchData.getBestsellerItems); 
router.post('/create-checkout-session', bodyParser.json(),stripeController.createCheckoutSession);
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.handleWebhook);

module.exports = router;
