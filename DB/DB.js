const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/meinShopDB", {
    useNewUrlParser : true,
    useUnifiedTopology:true
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Verbindungsfehler:"));
db.once("open", function(){
    console.log("Connected with MongoDB"); 
}); 
module.exports = db; 
