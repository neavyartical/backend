
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  email: String,
  type: String,
  amount: Number,
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
