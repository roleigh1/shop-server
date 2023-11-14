require('dotenv').config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});
async function authDb() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database: ', error);
    }
}
authDb();
const SeasonCardsDB = sequelize.define('Info', {

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
const BestsellerItemsDB = sequelize.define('Item', {
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
const ProductsDB = sequelize.define('Product', {
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

  const Order = sequelize.define('Order', {
    email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    item: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    total: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
    },
    pickupdate: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
    },
    location: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    }

}, {
    tableName: 'orders',
    timestamps:'true'
});




module.exports = {
    
    BestsellerItemsDB,
    SeasonCardsDB,
    ProductsDB,
    Order,
  
}