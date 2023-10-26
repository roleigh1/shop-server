require('dotenv').config();
const express = require("express");

const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5555;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const sequelize = new Sequelize('shopdb', 'root', process.env.MYSQL_PASSWORD, {
    host: 'localhost',
    dialect: 'mysql'
});

async function auth() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }


}
auth();
const Info = sequelize.define('Info', {

    name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    text: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    }
}, {
        tableName:'infos'
    })
const Item = sequelize.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      }
}, {
    tableName: 'items'
})
const Product = sequelize.define('Product', {
    // attributes
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'products'
  });

app.get('/infos', async (req, res) => {
    try {
        console.log('Fetching infos ...')
        const infos = await Info.findAll();
        res.json(infos);
       
    
    } catch (err) {
        console.error("Error fetching infos:", err);
        res.status(500).json({ message: 'Server Error'});
    }
});
app.get('/items', async (req,res) => {
    try {
        console.log('Fetching items ...')
        const items = await Item.findAll();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items", err);
        res.status(500).json({ message: 'Server Error'}); 
    }
    
});
app.get('/products', async (req,res) => {
    try {
        console.log('fetching products ...');
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products');
        res.status(500).json({ message: 'Server Error'});
    }
})
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});