const { body } = require("express-validator");

exports.validateRegistration = [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["Admin", "Client"])
];

exports.validateLogin = [
    body("email").isEmail(),
    body("password").notEmpty()
];
