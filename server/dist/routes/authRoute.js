"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controller/authController");
const router = express_1.default.Router();
router.post('/login', authController_1.Login);
router.post('/signup', authController_1.Signup);
router.post('/logout', authController_1.Logout);
router.post('/sendOTP', authController_1.sendOTP);
router.post('/verifyOTP', authController_1.verifyOTP);
router.post('/resetPassword', authController_1.resetPassword);
router.post('/pixeltrace/register', authController_1.pixelTraceRegister);
exports.default = router;
