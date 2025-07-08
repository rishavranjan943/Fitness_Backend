const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  activityLevel: String,
  goal: String,
  calories: Number,
  workout: String,
  bmi:Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Prediction", predictionSchema);
