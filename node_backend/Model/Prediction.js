const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  userId: {
    type: Number,      // ✅ numeric user IDs (1,2,3...)
    required: true
  },
  city: {
    type: String,
    required: true
  },
  parameter: {
    type: String,
    required: true
  },
  timeframe: {
    type: String,
    required: true
  },
  min_or_max: {
    type: String,
    required: true
  },
  predicted_value: {
    type: Number,
    required: true
  },
  disaster_risk: {
    type: String,
    required: true
  },
  forecast_message: {
    type: String,
    required: true
  },
  forecast_series: {
    type: [Number],
    required: true
  },
  forecast_plot: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Prediction", PredictionSchema);
