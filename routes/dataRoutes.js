const express = require('express');
const dataController = require('../controllers/dataController')

const routerData = express.Router();

routerData.get('/infos', dataController.getInfo);
routerData.get('/items', dataController.getItems);
routerData.get('/products', dataController.getProducts);

module.exports = routerData;