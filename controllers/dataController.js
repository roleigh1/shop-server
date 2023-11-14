const { SeasonCardsDB, BestsellerItemsDB, ProductsDB } = require('../models/models')



const getSeasonCards = async (req, res) => {
  try {
  //  console.log('fetching infos ...');
    const SeasonCards = await SeasonCardsDB.findAll();
    res.json(SeasonCards);
  } catch (err) {
    console.error('Error fetching infos: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBestsellerItems = async (req, res) => {
  try {
   // console.log('fetching items ...');
    const BestsellerItems = await BestsellerItemsDB.findAll();
    res.json(BestsellerItems);
  } catch (err) {
    console.error('Error fetching items: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getProducts = async (req, res) => {
  try {
    // console.log('fetching products ...');
    const products = await ProductsDB.findAll();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products: ', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {

  getBestsellerItems,
  getProducts,
};
