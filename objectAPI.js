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

app.get('/infos', async (req, res) => {
    try {
        console.log('Fetching infos ...PS C:\shop-server> node objectAPI')
        const infos = await Info.findAll();
        res.json(infos);
        console.log(infos);
    
    } catch (err) {
        console.error("Error fetching infos:", err);
        res.status(500).json({ message: 'Server Error'})
    }
});








app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});