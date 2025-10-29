"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const brevo_1 = __importStar(require("../config/brevo"));
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
    var _a, _b, _c;
    try {
        const { email } = req.body;
        const startTs = Date.now();
        console.log("[OTP] Request received", { email });
        if (!email) {
            return res
                .status(400)
                .send({ success: false, message: "Email is required" });
        }
        console.time("[OTP] prisma.user.findUnique");
        const existingUser = yield db_1.default.user.findUnique({ where: { email: email } });
        console.timeEnd("[OTP] prisma.user.findUnique");
        if (!existingUser) {
            return res
                .status(404)
                .send({ success: false, message: "User not found. Please sign up first." });
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Update user with OTP code
        console.time("[OTP] prisma.user.update(OTPCode)");
        yield db_1.default.user.update({ where: { email: email }, data: { OTPCode: verificationCode } });
        console.timeEnd("[OTP] prisma.user.update(OTPCode)");
        if (!process.env.SENDER_EMAIL || !brevo_1.hasBrevoApiKey) {
            console.error("[OTP] Email configuration missing.", {
                hasSenderEmail: !!process.env.SENDER_EMAIL,
                hasBrevoKey: brevo_1.hasBrevoApiKey,
                brevoKeySource: brevo_1.brevoApiKeySource,
            });
            return res
                .status(500)
                .send({ success: false, message: "Email service not configured. Please contact support." });
        }
        const mailOptions = (0, mailOptions_1.default)(email, verificationCode);
        console.log("[Email] Preparing to send OTP (Brevo):", {
            to: mailOptions.to,
            subject: mailOptions.subject,
            htmlLength: (_a = mailOptions.html) === null || _a === void 0 ? void 0 : _a.length
        });
        const sendSmtpEmail = {
            sender: { email: process.env.SENDER_EMAIL, name: "Sojo's Cafe" },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
        };
        try {
            console.time("[OTP] brevo.sendTransacEmail");
            const response = yield brevo_1.default.sendTransacEmail(sendSmtpEmail);
            console.timeEnd("[OTP] brevo.sendTransacEmail");
            console.log("[Email] OTP email sent (Brevo)", { to: mailOptions.to, messageId: response === null || response === void 0 ? void 0 : response.messageId });
        }
        catch (e) {
            const err = e;
            console.error("[Email] Brevo send failed:", {
                message: err === null || err === void 0 ? void 0 : err.message,
                code: err === null || err === void 0 ? void 0 : err.code,
                responseData: ((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.body) || ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data),
                stack: err === null || err === void 0 ? void 0 : err.stack,
            });
            return res.status(500).send({ success: false, message: "Failed to send OTP. Please try again." });
        }
        console.log("[OTP] Completed in", Date.now() - startTs, "ms");
        return res
            .status(200)
            .send({ success: true, message: "OTP sent successfully! Check your email." });
    }
    catch (error) {
        console.error("[OTP] Uncaught error:", error);
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
