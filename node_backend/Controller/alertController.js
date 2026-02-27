const User = require("../Model/User");
const sendAlertEmail = require("../Service/sendAlertEmail");

const sendAlertToEnabledUsers = async (req, res) => {
  try {
    const {
      alertType = "Emergency Alert",
      subject = "",
      message = "",
      sendToRole = "Client",
      targetUserId,
      targetUserIds,
    } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const filter = { emailAlertsEnabled: true };

    if (targetUserId !== undefined && targetUserId !== null && targetUserId !== "") {
      filter.userId = Number(targetUserId);
    }

    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      filter.userId = { $in: targetUserIds.map((id) => Number(id)) };
    }

    const usingSpecificTargets =
      (targetUserId !== undefined && targetUserId !== null && targetUserId !== "") ||
      (Array.isArray(targetUserIds) && targetUserIds.length > 0);

    if (!usingSpecificTargets) {
      if (sendToRole === "Client") filter.role = "Client";
    }

    const users = await User.find(filter).select(
      "name email userId role emailAlertsEnabled"
    );

    if (!users.length) {
      return res.status(200).json({
        message: "No enabled users found for this filter",
        sent: 0,
        failed: 0,
        results: [],
      });
    }

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const u of users) {
      try {
        await sendAlertEmail({
          to: u.email,
          name: u.name,
          subject: subject || `🚨 Climatrix SL Alert - ${alertType}`,
          alertType,
          message,
        });

        sent++;
        results.push({ userId: u.userId, email: u.email, status: "SENT" });
      } catch (err) {
        failed++;
        results.push({
          userId: u.userId,
          email: u.email,
          status: "FAILED",
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      message: "Alert sending finished",
      totalTargets: users.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  sendAlertToEnabledUsers,
};