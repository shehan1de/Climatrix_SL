const mongoose = require("mongoose");

const QuerySchema = new mongoose.Schema(
  {
    queryId: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    status: { type: String, enum: ["Pending", "Resolved"], default: "Pending" },

    replyMessage: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", QuerySchema);