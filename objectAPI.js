const express = require("express")
const router = express.Router();
const app = express();
const cors = require('cors');


app.use(cors());
const items = [
    {
      id: 1,
      name: 'Peaches',
      price: 2.99,
      image: 'https://i.ibb.co/Zm29fjS/peach-gbead77ccb-640.jpg',
      type: 'Fruit'
  },
  {
      id: 2,
      name: 'Strawberrys',
      price: 4.99,
      image: 'https://i.ibb.co/S6sK3C7/strawberries-g91324ddda-640.jpg',
      type: 'Fruit'
  },
  {
      id: 3,
      name: 'Paprika',
      price: 1.00,
      image: 'https://i.ibb.co/D7bBy1Q/bell-peppers-gc3855d807-640.jpg"',
      type: 'Vegetable'
  },
  {
      id: 4,
      name: 'Eggplant',
      price: 3.50,
      image: 'https://i.ibb.co/p0QrGTJ/eggplant-gbd2ba8a1c-640.jpg',
      type: 'Vegetable'
  
  }
  ];




module.exports = {
    items,
    infos,
    products,
}
app.listen(5050, () => {
    console.log('Server läuft auf Port 5050');
})