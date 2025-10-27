"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOTP = exports.sendOTP = exports.Logout = exports.Login = exports.Signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const token_1 = __importDefault(require("../utils/token"));
const mailOptions_1 = __importDefault(require("../utils/mailOptions"));
const nodemailer_1 = __importDefault(require("../config/nodemailer"));
const adminToken_1 = __importDefault(require("../utils/adminToken"));
const Signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, number } = req.body;
    try {
        const existingUser = yield db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res
                .status(409)
                .send({ success: false, message: "User already exists" });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const newUser = yield db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                number,
            },
        });
        yield (0, token_1.default)(newUser.id, res);
        return res.status(200).send({
            success: true,
            message: "User created successfully",
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.Signup = Signup;
const Login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            try {
                yield (0, adminToken_1.default)(res);
            }
            catch (error) {
                console.error("Error generating admin token:", error);
                return res.status(500).send({ success: false, message: "Admin token generation failed" });
            }
            return res.status(200).send({ success: true, message: "Admin" });
        }
        const user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .send({ success: false, message: "User does not exists" });
        }
        const verifyPassword = yield bcrypt_1.default.compare(password, user.password);
        if (!verifyPassword) {
            return res
                .status(401)
                .send({ success: false, message: "Password does not match" });
        }
        yield (0, token_1.default)(user.id, res);
        console.log("Login successful, JWT cookie set for user:", user.id);
        return res.status(200).send({
            success: true,
            message: "User logged in successfully",
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.Login = Login;
const Logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Logout endpoint hit - clearing cookies");
        res.clearCookie("jwt");
        res.clearCookie("adminSession");
        console.log("Cookies cleared successfully");
        return res.status(200).send({ success: true, message: "User log out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send({ success: false, message: error });
    }
});
exports.Logout = Logout;
const sendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        console.log("OTP request received for email:", email);
        if (!email) {
            return res
                .status(400)
                .send({ success: false, message: "Email is required" });
        }
        // Check if user exists
        const existingUser = yield db_1.default.user.findUnique({
            where: { email: email }
        });
        console.log("User found:", !!existingUser);
        if (!existingUser) {
            return res
                .status(404)
                .send({ success: false, message: "User not found. Please sign up first." });
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("Generated OTP code:", verificationCode);
        // Update user with OTP code
        yield db_1.default.user.update({
            where: { email: email },
            data: { OTPCode: verificationCode },
        });
        console.log("OTP code saved to database");
        // Check if email configuration is available
        if (!process.env.SMPT_USER || !process.env.SMPT_PASSWORD || !process.env.SENDER_EMAIL) {
            console.error("Email configuration missing. SMPT_USER:", !!process.env.SMPT_USER, "SMPT_PASSWORD:", !!process.env.SMPT_PASSWORD, "SENDER_EMAIL:", !!process.env.SENDER_EMAIL);
            return res
                .status(500)
                .send({ success: false, message: "Email service not configured. Please contact support." });
        }
        console.log("Email configuration check passed");
        const mailOptions = (0, mailOptions_1.default)(email, verificationCode);
        console.log("Mail options created");
        yield nodemailer_1.default.sendMail(mailOptions);
        console.log("Email sent successfully");
        return res
            .status(200)
            .send({ success: true, message: "OTP sent successfully! Check your email." });
        console.log("Email sent successfully");
    }
    catch (error) {
        console.error("OTP sending error:", error);
        return res.status(500).send({
            success: false,
            message: error instanceof Error ? error.message : "Failed to send OTP. Please try again."
        });
    }
});
exports.sendOTP = sendOTP;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { verificationCode, email } = req.body;
        if (!verificationCode) {
            return res.status(400).send({ success: false, message: "OTP not received" });
        }
        const user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).send({ success: false, message: "User not found" });
        }
        const otp = user.OTPCode;
        if (verificationCode != otp) {
            return res.status(400).send({ success: false, message: "Invalid OTP" });
        }
        yield db_1.default.user.update({
            where: { email: email },
            data: { isVerify: true, OTPCode: "" },
        });
        return res.status(200).send({ success: true, message: "Email verified successfully" });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.verifyOTP = verifyOTP;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, newPassword } = req.body;
        if (!password || !newPassword || !email) {
            return res.status(400).send({ success: false, message: "Invalid creditentials" });
        }
        const user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).send({ success: false, message: "User not found" });
        }
        const verifyPassword = yield bcrypt_1.default.compare(password, user.password);
        if (!verifyPassword) {
            return res.status(401).send({ success: false, message: "Invalid credientials" });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashPassword = yield bcrypt_1.default.hash(newPassword, salt);
        yield db_1.default.user.update({
            where: { email: email },
            data: { password: hashPassword },
        });
        return res
            .status(200)
            .send({ success: true, message: "Password reset successfully" });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.resetPassword = resetPassword;
