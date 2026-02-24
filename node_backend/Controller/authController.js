const User = require("../Model/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const sendOtpEmail = require("../Service/emailService");

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

/* =========================
   REGISTER
========================= */
const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({
            name,
            email,
            password,
            role
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   LOGIN
========================= */
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                userId: user.userId,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   REQUEST PASSWORD RESET
========================= */
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const otp = generateOtp();

        user.resetToken = await bcrypt.hash(otp, 10);
        user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await sendOtpEmail(email, otp);

        res.json({ message: "Reset code sent to email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   VERIFY OTP CODE
========================= */
const verifyCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !user.resetToken || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        const isMatch = await bcrypt.compare(code, user.resetToken);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        res.json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   RESET PASSWORD
========================= */
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !user.resetToken || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        const isMatch = await bcrypt.compare(code, user.resetToken);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid code" });
        }

        user.password = newPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    registerUser,
    login,
    requestPasswordReset,
    verifyCode,
    resetPassword
};
