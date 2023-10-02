const mongoose = require("mongoose");
 
const orderSchema = new mongoose.Schema({
    stripeSessionId: String,
    email: String,
    item: Array,
    totalValue: Number,
    payed: Boolean,
    date: { type: Date , default: Date.now }
});

const Order = mongoose.model("Bestellung", bestellungSchema);

module.exports = Bestellung;