const Query = require("../Model/Query");
const Counter = require("../Model/Counter");

exports.createQuery = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "queryId" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const queryId = `QRY-${String(counter.value).padStart(4, "0")}`;

    const newQuery = await Query.create({
      queryId,
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message).trim(),
      status: "Pending",
    });

    return res.status(201).json({
      message: "Query submitted successfully",
      query: newQuery,
    });
  } catch (error) {
    console.error("createQuery error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};