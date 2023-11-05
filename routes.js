const express = require('express');
const {  Item, Product, Info } = require('./models'); 

const router = express.Router(); 

router.get('/infos', async (req,res) =>  {
    try {
        console.log('fetching infos ...');
        const infos = await Info.findAll();
        res.json(infos);
    } catch (err) {
        console.error('Error fetchin infos: ', err );
        res.status(500).json({ message: 'Server Error'});
    }
}); 

router.get('/items', async (req,res) => {
    try {
     console.log('fetching items ...');
        const items = await Item.findAll();
        res.json(items);
    } catch (err) {
        console.error('Error fetich items ' , err);
        res.status(500).json({ message: 'Server Error'}); 
    }
});

router.get('/products', async (req,res) => {
    try {
     console.log('fetching products ...'); 
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products: ', err); 
        res.status(500).json({ message: 'Server Error'});
    }
}); 
module.exports = router;