const express = require("express");
const router = express.Router();
const adminQueryController = require("../Controller/queryController");

// later: router.use(verifyToken, requireAdmin);

router.get("/admin/queries", adminQueryController.getAllQueries);
router.get("/admin/queries/:id", adminQueryController.getOneQuery);
router.post("/admin/queries/:id/reply", adminQueryController.replyToQuery);

module.exports = router;