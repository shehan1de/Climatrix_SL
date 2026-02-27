const Query = require("../Model/Query");
const sendQueryReplyEmail = require("../Service/sendQueryReplyEmail");

exports.getAllQueries = async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    return res.status(200).json({ count: queries.length, queries });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getOneQuery = async (req, res) => {
  try {
    const q = await Query.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Query not found" });
    return res.status(200).json({ query: q });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.replyToQuery = async (req, res) => {
  try {
    const { replyMessage = "", subject = "", repliedBy } = req.body;

    if (!replyMessage || !String(replyMessage).trim()) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const q = await Query.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Query not found" });

    await sendQueryReplyEmail({
      to: q.email,
      name: q.name,
      subject: subject || `Climatrix SL Support Reply - ${q.queryId}`,
      queryId: q.queryId,
      userMessage: q.message,
      replyMessage: String(replyMessage).trim(),
    });

    q.replyMessage = String(replyMessage).trim();
    q.repliedAt = new Date();
    q.status = "Resolved";

    if (repliedBy !== undefined && repliedBy !== null && repliedBy !== "") {
      q.repliedBy = Number(repliedBy);
    }

    await q.save();

    return res.status(200).json({
      message: "Reply sent and query marked as resolved",
      query: q,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};