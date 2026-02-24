// Route/userRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const userController = require("../Controller/userController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../image"));
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Add new user
router.post("/user", userController.addUser);

// Get all users
router.get("/users", userController.getAllUsers);

// ✅ Admin: view alert enabled/disabled users
// /api/users/alerts?enabled=true  OR enabled=false  OR no query -> all
router.get("/users/alerts", userController.getAlertSubscribers);

// Get user by userId
router.get("/user/:userId", userController.getUserByUserId);

// Update user
router.put("/user/:userId", userController.updateUser);

// Delete user
router.delete("/user/:userId", userController.deleteUser);

// Edit user role
router.put("/user/:userId/role", userController.editUserRole);

// Update profile, including image upload
router.put("/user/:userId/profile", upload.single("image"), userController.updateProfile);

/* ✅ Client Alert Toggle */
router.get("/user/:userId/alerts", userController.getAlertPreference);
router.put("/user/:userId/alerts", userController.updateAlertPreference);

module.exports = router;