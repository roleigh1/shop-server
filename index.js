const express = require("express");
const {sequelize} = require("sequelize");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5555; 

const app = express(); 
app.use(cors);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})
