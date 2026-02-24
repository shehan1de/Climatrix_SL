const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Set up multer storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save images in the 'image' folder
        cb(null, path.join(__dirname, "../image"));
    },
    filename: (req, file, cb) => {
        // Use a unique filename with timestamp and the original file extension
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Create multer instance with storage configuration
const upload = multer({ storage: storage });

// Define a route for uploading images
router.post("/upload", upload.single("image"), (req, res) => {
    // Check if the file was uploaded
    if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
    }
    // Return the file path if upload is successful
    res.status(200).send({
        message: "Image uploaded successfully",
        filePath: `/image/${req.file.filename}`,
    });
});

module.exports = router;
