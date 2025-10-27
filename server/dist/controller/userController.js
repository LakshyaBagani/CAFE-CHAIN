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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRestaurants = exports.fetchWalletHistory = exports.userInfo = exports.getWalletBalance = exports.addWalletBalance = exports.allMenu = exports.getOrders = exports.createOrder = void 0;
const db_1 = __importDefault(require("../config/db"));
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { totalPrice, orderItems, paymentMethod, deliveryType } = req.body;
    const userId = req.userId;
    const restoId = req.params.restoId;
    try {
        if (!totalPrice || !orderItems || !restoId || !userId) {
            return res.status(400).send({ success: false, message: "All fields are required" });
        }
        const order = yield db_1.default.order.create({
            data: { userId, totalPrice: parseInt(totalPrice), paymentMethod, deliveryType, restoId: parseInt(restoId) },
        });
        for (let i = 0; i < orderItems.length; i++) {
            const { dishName, quantity } = orderItems[i];
            const menuItem = yield db_1.default.menu.findFirst({
                where: { name: dishName }
            });
            if (!menuItem) {
                return res.status(404).send({
                    success: false,
                    message: `Menu item '${dishName}' not found`
                });
            }
            // Create order item
            yield db_1.default.orderItem.create({
                data: {
                    orderId: order.id,
                    menuId: menuItem.id,
                    quantity: parseInt(quantity)
                }
            });
        }
        return res.status(200).send({ success: true, message: "Order created successfully", order });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
    }
});
exports.createOrder = createOrder;
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const orders = yield db_1.default.order.findMany({
            where: { userId },
            include: {
                orderItems: {
                    include: {
                        menu: {
                            include: {
                                resto: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).send({ success: true, message: "Orders fetched successfully", orders });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getOrders = getOrders;
const allMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { restoId } = req.params;
    try {
        if (!restoId) {
            return res.status(400).send({ success: false, message: "Resto ID is required" });
        }
        // Optimized query: Only select needed fields and check if restaurant is open
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restoId) },
            select: { id: true, open: true, name: true }
        });
        if (!resto) {
            return res.status(400).send({ success: false, message: "Resto not found" });
        }
        if (!resto.open) {
            return res.status(200).send({ success: true, message: "Resto is closed", menu: [] });
        }
        // Optimized query: Use index on restoId and availability, select only needed fields
        const menu = yield db_1.default.menu.findMany({
            where: {
                restoId: parseInt(restoId),
                availability: true // Only get available items
            },
            select: {
                id: true,
                name: true,
                price: true,
                description: true,
                imageUrl: true,
                veg: true,
                category: true,
                availability: true
            },
            orderBy: [
                { availability: 'desc' }, // Available items first
                { name: 'asc' } // Then sort by name
            ]
        });
        return res.status(200).send({ success: true, message: "Menu fetched successfully", menu });
    }
    catch (error) {
        console.error("Error fetching menu:", error);
        return res.status(500).send({ success: false, message: "Internal server error" });
    }
});
exports.allMenu = allMenu;
const addWalletBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { amount, modeOfPayment } = req.body;
    try {
        if (!userId) {
            return res.status(400).send({ success: false, message: "User ID is required" });
        }
        const user = yield db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).send({ success: false, message: "User not found" });
        }
        const userWallet = yield db_1.default.userWallet.create({
            data: { userId, amount: parseInt(amount), modeOfPayment }
        });
        const updatedBalance = user.balance + parseInt(amount);
        yield db_1.default.user.update({ where: { id: userId }, data: { balance: updatedBalance } });
        return res.status(200).send({ success: true, message: "Wallet balance updated successfully", userWallet, balance: updatedBalance });
    }
    catch (error) {
        console.error('Error adding wallet balance:', error);
        return res.status(500).send({ success: false, message: error });
    }
});
exports.addWalletBalance = addWalletBalance;
const getWalletBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        // Only fetch balance field for better performance
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
            select: { balance: true }
        });
        if (!user) {
            return res.status(400).send({ success: false, message: "User not found" });
        }
        return res.status(200).send({ success: true, message: "Wallet balance fetched successfully", balance: user.balance });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getWalletBalance = getWalletBalance;
const userInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const isAdmin = req.isAdmin;
    try {
        // Check if admin session
        if (isAdmin && userId === 0) {
            const adminUser = {
                id: 0,
                name: 'Admin',
                email: process.env.ADMIN_EMAIL,
                number: '9876543210',
                isVerify: true,
                isAdmin: true
            };
            return res.status(200).send({ success: true, message: "Admin info fetched successfully", user: adminUser });
        }
        if (!userId) {
            return res.status(400).send({ success: false, message: "User ID is required" });
        }
        const user = yield db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).send({ success: false, message: "User not found" });
        }
        const { password, OTPCode } = user, userInfo = __rest(user, ["password", "OTPCode"]);
        const cleanUser = Object.assign(Object.assign({}, userInfo), { number: userInfo.number.toString() });
        return res.status(200).send({ success: true, message: "User info fetched successfully", user: cleanUser });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.userInfo = userInfo;
const fetchWalletHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            return res.status(400).send({ success: false, message: "User ID is required" });
        }
        // Limit to last 20 transactions for better performance
        const history = yield db_1.default.userWallet.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                amount: true,
                modeOfPayment: true,
                createdAt: true
            }
        });
        return res.status(200).send({ success: true, message: "Wallet history fetched successfully", history });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.fetchWalletHistory = fetchWalletHistory;
const getAllRestaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurants = yield db_1.default.resto.findMany({
            select: {
                id: true,
                name: true,
                location: true,
                open: true
            },
            orderBy: { name: 'asc' }
        });
        if (!restaurants || restaurants.length === 0) {
            return res
                .status(400)
                .send({ success: false, message: "No restaurants found" });
        }
        return res.status(200).send({
            success: true,
            message: "Restaurants fetched successfully",
            restaurants: restaurants,
        });
    }
    catch (error) {
        console.error("Error fetching restaurants for users:", error);
        return res.status(500).send({ success: false, message: "Internal server error" });
    }
});
exports.getAllRestaurants = getAllRestaurants;
