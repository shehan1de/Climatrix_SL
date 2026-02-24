const express = require("express");
const router = express.Router();
const Prediction = require("../Model/Prediction");

// ✅ Save prediction history
router.post("/save_history", async (req, res) => {
  try {
    const prediction = new Prediction({
      userId: Number(req.body.userId), // ensure numeric
      city: req.body.city,
      parameter: req.body.parameter,
      timeframe: req.body.timeframe,
      min_or_max: req.body.min_or_max,

      // ✅ ensure numeric
      predicted_value: Number(req.body.predicted_value),

      disaster_risk: req.body.disaster_risk,
      forecast_message: req.body.forecast_message,

      // ✅ safe default
      forecast_series: Array.isArray(req.body.forecast_series)
        ? req.body.forecast_series
        : [],

      // ✅ NEW: save plot (base64 string)
      forecast_plot: req.body.forecast_plot || null
    });

    await prediction.save();
    res.status(201).json({ message: "Prediction saved successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save prediction" });
  }
});

// ✅ Get all predictions (admin / testing)
router.get("/", async (req, res) => {
  try {
    const data = await Prediction.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
});

// ✅ Get predictions by userId (CLIENT VIEW)
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const data = await Prediction.find({ userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user predictions" });
  }
});

module.exports = router;