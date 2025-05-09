const mongoose = require('mongoose')


var usersDB = mongoose.createConnection('mongodb+srv://ragavandevp:4X3U3uIPo0FHQNP4@chatbot.hfmmpqr.mongodb.net/?retryWrites=true&w=majority&appName=test');

var Message = usersDB.model('products', new mongoose.Schema({
    product_id: Number,
    product_name: String,
    price: String,
    category: String,
    made_in: String,
    spec: String
}))



module.exports = Message