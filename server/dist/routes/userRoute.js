"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authProtect_1 = __importDefault(require("../middleware/authProtect"));
const userController_1 = require("../controller/userController");
const router = (0, express_1.Router)();
router.post("/resto/:restoId/order", authProtect_1.default, userController_1.createOrder);
router.get("/resto/:restoId/menu", authProtect_1.default, userController_1.allMenu);
router.get('/orderHistory', authProtect_1.default, userController_1.getOrders);
router.post('/addWalletBalance', authProtect_1.default, userController_1.addWalletBalance);
router.get('/getWalletBalance', authProtect_1.default, userController_1.getWalletBalance);
router.get('/userInfo', authProtect_1.default, userController_1.userInfo);
router.get('/walletHistory', authProtect_1.default, userController_1.fetchWalletHistory);
router.get('/restaurants', userController_1.getAllRestaurants);
exports.default = router;
