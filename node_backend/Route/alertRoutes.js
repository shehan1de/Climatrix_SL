// Route/alertRoutes.js
const express = require("express");
const router = express.Router();
const alertController = require("../Controller/alertController");

// ✅ (Recommended) later add admin middleware here
// router.post("/admin/alerts/send", verifyToken, requireAdmin, alertController.sendAlertToEnabledUsers);

router.post("/admin/alerts/send", alertController.sendAlertToEnabledUsers);

module.exports = router;