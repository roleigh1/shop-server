
const { Item, Product, Info } = require('../models');

const getInfo = async (req, res) => {
  try {
    console.log('fetching infos ...');
    const infos = await Info.findAll();
    res.json(infos);
  } catch (err) {
    console.error('Error fetching infos: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getItems = async (req, res) => {
  try {
    console.log('fetching items ...');
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    console.error('Error fetching items: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getProducts = async (req, res) => {
  try {
    console.log('fetching products ...');
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getInfo,
  getItems,
  getProducts,
};