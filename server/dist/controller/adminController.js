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
exports.getDashboardStats = exports.deleteMenu = exports.editMenu = exports.changeOrderStatus = exports.resoStatus = exports.getMenuVersion = exports.changeMenuStatus = exports.deleteAds = exports.getAds = exports.runAds = exports.deliveredOrdersForDay = exports.restoOrderHistory = exports.getDailyRevenue = exports.addMenu = exports.getAdminAnalytics = exports.getRestaurantAnalytics = exports.allResto = exports.createResto = void 0;
const db_1 = __importDefault(require("../config/db"));
const supabaseConfig_1 = require("../config/supabaseConfig");
const bcrypt_1 = __importDefault(require("bcrypt"));
const path_1 = __importDefault(require("path"));
const createResto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, location, number } = req.body;
    try {
        const email = `${number}@gmail.com`;
        const password = `${number}@payment`;
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        if (!name || !location || !number) {
            return res
                .status(400)
                .send({ success: false, message: "All fields are required" });
        }
        const existingResto = yield db_1.default.resto.findUnique({ where: { number } });
        if (existingResto) {
            return res
                .status(400)
                .send({ success: false, message: "Resto already exists" });
        }
        const resto = yield db_1.default.resto.create({
            data: { name, location, number, email, password: hashedPassword },
        });
        return res
            .status(200)
            .send({ success: true, message: "Resto created successfully" });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.createResto = createResto;
const allResto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Optimized query: Only select needed fields
        const resto = yield db_1.default.resto.findMany({
            select: {
                id: true,
                name: true,
                location: true,
                open: true,
                menuVersion: true
            },
            orderBy: { name: 'asc' }
        });
        if (!resto || resto.length === 0) {
            return res
                .status(400)
                .send({ success: false, message: "No resto found" });
        }
        // Get today's date for daily stats
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        // Create date range for the day
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        // Optimized query: Use indexes and limit to only delivered orders
        const dailyStats = yield db_1.default.order.groupBy({
            by: ['restoId'],
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
                status: 'delivered'
            },
            _count: {
                id: true
            },
            _sum: {
                totalPrice: true
            }
        });
        // Create a map for quick lookup
        const statsMap = new Map();
        dailyStats.forEach((stat) => {
            var _a, _b;
            statsMap.set(stat.restoId, {
                orderCount: ((_a = stat._count) === null || _a === void 0 ? void 0 : _a.id) || 0,
                totalRevenue: Number((_b = stat._sum) === null || _b === void 0 ? void 0 : _b.totalPrice) || 0,
                date: dateStr
            });
        });
        // Add daily stats to each restaurant
        const restoWithStats = resto.map(restaurant => (Object.assign(Object.assign({}, restaurant), { dailyStats: statsMap.get(restaurant.id) || {
                orderCount: 0,
                totalRevenue: 0,
                date: dateStr
            } })));
        return res.status(200).send({
            success: true,
            message: "All resto fetched successfully",
            resto: restoWithStats,
        });
    }
    catch (error) {
        console.error("Error fetching restaurants:", error);
        return res.status(500).send({ success: false, message: "Internal server error" });
    }
});
exports.allResto = allResto;
const getRestaurantAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurantId } = req.params;
        if (!restaurantId) {
            return res
                .status(400)
                .send({ success: false, message: "Restaurant ID is required" });
        }
        // Calculate date range for last 7 days
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get restaurant info
        const restaurant = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restaurantId) },
            select: { id: true, name: true },
        });
        if (!restaurant) {
            return res
                .status(404)
                .send({ success: false, message: "Restaurant not found" });
        }
        // Get orders for this restaurant in the specified period
        const orders = yield db_1.default.order.findMany({
            where: {
                orderItems: {
                    some: {
                        menu: {
                            restoId: parseInt(restaurantId),
                        },
                    },
                },
                createdAt: {
                    gte: startDate,
                    lte: now,
                },
            },
            include: {
                orderItems: {
                    where: {
                        menu: {
                            restoId: parseInt(restaurantId),
                        },
                    },
                    include: {
                        menu: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        number: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        // Calculate overview metrics
        const totalRevenue = orders.reduce((sum, order) => {
            const restaurantOrderTotal = order.orderItems.reduce((itemSum, item) => itemSum + item.quantity * item.menu.price, 0);
            return sum + restaurantOrderTotal;
        }, 0);
        const totalOrders = orders.length;
        const totalCustomers = new Set(orders.map((order) => order.user.id)).size;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Calculate growth rate (compare with previous period)
        const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const previousOrders = yield db_1.default.order.findMany({
            where: {
                orderItems: {
                    some: {
                        menu: {
                            restoId: parseInt(restaurantId),
                        },
                    },
                },
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate,
                },
            },
            include: {
                orderItems: {
                    where: {
                        menu: {
                            restoId: parseInt(restaurantId),
                        },
                    },
                    include: {
                        menu: true,
                    },
                },
            },
        });
        const previousRevenue = previousOrders.reduce((sum, order) => {
            const restaurantOrderTotal = order.orderItems.reduce((itemSum, item) => itemSum + item.quantity * item.menu.price, 0);
            return sum + restaurantOrderTotal;
        }, 0);
        const growthRate = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : 0;
        // Get daily sales data
        const dailySalesMap = new Map();
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split("T")[0];
            const orderRevenue = order.orderItems.reduce((sum, item) => sum + item.quantity * item.menu.price, 0);
            if (!dailySalesMap.has(date)) {
                dailySalesMap.set(date, {
                    date,
                    revenue: 0,
                    orders: 0,
                    customers: new Set(),
                });
            }
            const dayData = dailySalesMap.get(date);
            dayData.revenue += orderRevenue;
            dayData.orders += 1;
            dayData.customers.add(order.user.id);
        });
        const dailySales = Array.from(dailySalesMap.values())
            .map((day) => ({
            date: day.date,
            revenue: day.revenue,
            orders: day.orders,
            customers: day.customers.size,
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Get top selling items
        const itemSales = new Map();
        orders.forEach((order) => {
            order.orderItems.forEach((item) => {
                const key = `${item.menu.id}-${item.menu.name}`;
                if (!itemSales.has(key)) {
                    itemSales.set(key, {
                        id: item.menu.id,
                        name: item.menu.name,
                        quantity: 0,
                        revenue: 0,
                    });
                }
                const itemData = itemSales.get(key);
                itemData.quantity += item.quantity;
                itemData.revenue += item.quantity * item.menu.price;
            });
        });
        const topSellingItems = Array.from(itemSales.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
        // Get customer metrics
        const allCustomers = new Set(orders.map((order) => order.user.id));
        const newCustomers = new Set();
        const returningCustomers = new Set();
        // Check if customers are new or returning
        for (const customerId of allCustomers) {
            const customerOrders = orders.filter((order) => order.user.id === customerId);
            const firstOrderDate = new Date(Math.min(...customerOrders.map((order) => order.createdAt.getTime())));
            if (firstOrderDate >= startDate) {
                newCustomers.add(customerId);
            }
            else {
                returningCustomers.add(customerId);
            }
        }
        return res.status(200).send({
            success: true,
            data: {
                overview: {
                    totalRevenue,
                    totalOrders,
                    totalCustomers,
                    averageOrderValue,
                    growthRate: Math.round(growthRate * 100) / 100,
                },
                dailySales,
                topSellingItems,
                customerMetrics: {
                    newCustomers: newCustomers.size,
                    returningCustomers: returningCustomers.size,
                    averageSessionTime: 25, // Mock data - would need session tracking
                    customerSatisfaction: 4.6, // Mock data - would need rating system
                },
            },
        });
    }
    catch (error) {
        console.error("Restaurant analytics error:", error);
        return res
            .status(500)
            .send({
            success: false,
            message: "Failed to fetch restaurant analytics",
        });
    }
});
exports.getRestaurantAnalytics = getRestaurantAnalytics;
const getAdminAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Calculate date range for last 7 days
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get all orders in the specified period
        const orders = yield db_1.default.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: now,
                },
            },
            include: {
                orderItems: {
                    include: {
                        menu: {
                            include: {
                                resto: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        number: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        // Calculate total metrics
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Get daily revenue data
        const dailyRevenueMap = new Map();
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split("T")[0];
            if (!dailyRevenueMap.has(date)) {
                dailyRevenueMap.set(date, {
                    date,
                    revenue: 0,
                    orders: 0,
                });
            }
            const dayData = dailyRevenueMap.get(date);
            dayData.revenue += order.totalPrice;
            dayData.orders += 1;
        });
        const dailyRevenue = Array.from(dailyRevenueMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Get monthly revenue data (last 6 months)
        const monthlyRevenueMap = new Map();
        orders.forEach((order) => {
            const monthKey = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
            const monthName = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
            });
            if (!monthlyRevenueMap.has(monthKey)) {
                monthlyRevenueMap.set(monthKey, {
                    month: monthName,
                    revenue: 0,
                    orders: 0,
                });
            }
            const monthData = monthlyRevenueMap.get(monthKey);
            monthData.revenue += order.totalPrice;
            monthData.orders += 1;
        });
        const monthlyRevenue = Array.from(monthlyRevenueMap.values())
            .sort((a, b) => {
            const monthOrder = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        })
            .slice(-6); // Last 6 months
        // Get top restaurants by revenue
        const restaurantRevenueMap = new Map();
        orders.forEach((order) => {
            // Get restaurant info from the first order item
            if (order.orderItems.length > 0) {
                const restaurantId = order.orderItems[0].menu.resto.id;
                const restaurantName = order.orderItems[0].menu.resto.name;
                if (!restaurantRevenueMap.has(restaurantId)) {
                    restaurantRevenueMap.set(restaurantId, {
                        id: restaurantId,
                        name: restaurantName,
                        revenue: 0,
                        orders: 0,
                        rating: 4.5, // Mock rating - would need rating system
                    });
                }
                const restaurantData = restaurantRevenueMap.get(restaurantId);
                // Use order total price (includes GST) instead of calculating from items
                restaurantData.revenue += order.totalPrice;
                restaurantData.orders += 1;
            }
        });
        const topRestaurants = Array.from(restaurantRevenueMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        return res.status(200).send({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                topRestaurants,
                dailyRevenue,
                monthlyRevenue,
            },
        });
    }
    catch (error) {
        console.error("Admin analytics error:", error);
        return res
            .status(500)
            .send({ success: false, message: "Failed to fetch admin analytics" });
    }
});
exports.getAdminAnalytics = getAdminAnalytics;
const addMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { name, price, description, type, category } = req.body;
        const file = req.file;
        if (!name || !price || !description) {
            return res.status(400).send({
                success: false,
                message: "Name, price, and description are required",
            });
        }
        let foodType = false;
        if (type === "Veg") {
            foodType = true;
        }
        if (!file) {
            return res.status(400).send({
                success: false,
                message: "Image is required",
            });
        }
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restoId) },
        });
        if (!resto) {
            return res.status(404).send({
                success: false,
                message: "Restaurant not found",
            });
        }
        const fileExt = path_1.default.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${fileExt}`;
        const { data: uploadData, error: uploadError } = yield supabaseConfig_1.supabase.storage
            .from("Menu_Images")
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (uploadError) {
            return res.status(500).send({
                success: false,
                message: "Failed to upload image",
                error: uploadError.message,
            });
        }
        const { data: { publicUrl }, } = supabaseConfig_1.supabase.storage.from("Menu_Images").getPublicUrl(fileName);
        const menuItem = yield db_1.default.menu.create({
            data: {
                name,
                price: parseInt(price),
                description,
                imageUrl: publicUrl,
                veg: foodType,
                restoId: parseInt(restoId),
                category,
            },
        });
        yield db_1.default.resto.update({
            where: { id: parseInt(restoId) },
            data: { menuVersion: resto.menuVersion + 1 },
        });
        return res.status(200).send({
            success: true,
            message: "Menu item added successfully",
            menuItem,
        });
    }
    catch (error) {
        return res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.addMenu = addMenu;
const getDailyRevenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { date } = req.body;
        if (!date) {
            return res.status(400).send({
                success: false,
                message: "Date is required (format: YYYY-MM-DD)",
            });
        }
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const orders = yield db_1.default.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                },
                orderItems: {
                    some: {
                        menu: {
                            restoId: parseInt(restoId),
                        },
                    },
                },
            },
            select: {
                totalPrice: true,
                createdAt: true,
            },
        });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const orderCount = orders.length;
        return res.status(200).send({
            success: true,
            message: "Daily revenue fetched successfully",
            data: {
                date: date,
                totalRevenue,
                orderCount,
                orders,
            },
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getDailyRevenue = getDailyRevenue;
const restoOrderHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { date } = req.body;
        if (!date) {
            return res
                .status(400)
                .send({ success: false, message: "Date is required" });
        }
        // Parse the date and create date range for the day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        const orders = yield db_1.default.order.findMany({
            where: {
                restoId: parseInt(restoId),
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
            include: {
                orderItems: {
                    include: {
                        menu: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        number: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Convert BigInt to string for JSON safety
        const safeOrders = orders.map((o) => {
            var _a, _b, _c;
            return (Object.assign(Object.assign({}, o), { user: o.user
                    ? Object.assign(Object.assign({}, o.user), { number: (_c = (_b = (_a = o.user) === null || _a === void 0 ? void 0 : _a.number) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b) }) : o.user }));
        });
        return res.status(200).send({
            success: true,
            message: "Order history fetched successfully",
            orders: safeOrders,
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.restoOrderHistory = restoOrderHistory;
const deliveredOrdersForDay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { date } = req.body;
        if (!date) {
            return res
                .status(400)
                .send({ success: false, message: "Date is required (YYYY-MM-DD)" });
        }
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const orders = yield db_1.default.order.findMany({
            where: {
                restoId: parseInt(restoId),
                status: "Delivered",
                createdAt: { gte: startDate, lt: endDate },
            },
            include: {
                orderItems: { include: { menu: true } },
                user: { select: { id: true, name: true, email: true, number: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        const safeOrders = orders.map((o) => {
            var _a, _b, _c;
            return (Object.assign(Object.assign({}, o), { user: o.user
                    ? Object.assign(Object.assign({}, o.user), { number: (_c = (_b = (_a = o.user) === null || _a === void 0 ? void 0 : _a.number) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b) }) : o.user }));
        });
        return res.status(200).send({
            success: true,
            message: "Delivered orders fetched successfully",
            orders: safeOrders,
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.deliveredOrdersForDay = deliveredOrdersForDay;
const runAds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { menuName, discount } = req.body;
        const menu = yield db_1.default.menu.findFirst({
            where: { name: menuName },
        });
        if (!menu) {
            return res
                .status(404)
                .send({ success: false, message: "Menu not found" });
        }
        const ads = yield db_1.default.ads.create({
            data: {
                restoId: parseInt(restoId),
                menuId: menu.id,
                discount: parseInt(discount),
            },
        });
        return res
            .status(200)
            .send({ success: true, message: "Ads created successfully", ads });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.runAds = runAds;
const getAds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const ads = yield db_1.default.ads.findMany({
            where: { restoId: parseInt(restoId) },
        });
        return res
            .status(200)
            .send({ success: true, message: "Ads fetched successfully", ads });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getAds = getAds;
const deleteAds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adsId } = req.body;
        const ads = yield db_1.default.ads.delete({
            where: { id: parseInt(adsId) },
        });
        return res
            .status(200)
            .send({ success: true, message: "Ads deleted successfully", ads });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.deleteAds = deleteAds;
const changeMenuStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { status, orderId, menuId, restoId: bodyRestoId } = req.body;
        // Use restoId from params or body
        const actualRestoId = restoId || bodyRestoId;
        if (!actualRestoId) {
            return res
                .status(404)
                .send({ success: false, message: "Resto not found" });
        }
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(actualRestoId) },
        });
        if (!resto) {
            return res
                .status(404)
                .send({ success: false, message: "Resto not found" });
        }
        // Handle menu availability change
        if (menuId) {
            if (status === undefined) {
                return res
                    .status(400)
                    .send({ success: false, message: "Status is required" });
            }
            const menu = yield db_1.default.menu.update({
                where: { id: parseInt(menuId) },
                data: { availability: status },
            });
            yield db_1.default.resto.update({
                where: { id: parseInt(actualRestoId) },
                data: { menuVersion: resto.menuVersion + 1 },
            });
            return res.status(200).send({
                success: true,
                message: "Menu availability changed successfully",
                menu,
            });
        }
        // Handle order status change (existing functionality)
        if (!status || !orderId) {
            return res
                .status(400)
                .send({ success: false, message: "Status and orderId are required" });
        }
        const order = yield db_1.default.order.update({
            where: { id: parseInt(orderId) },
            data: { status },
        });
        yield db_1.default.resto.update({
            where: { id: parseInt(actualRestoId) },
            data: { menuVersion: resto.menuVersion + 1 },
        });
        return res
            .status(200)
            .send({ success: true, message: "Status changed successfully", order });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.changeMenuStatus = changeMenuStatus;
const getMenuVersion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        console.log("Resto ID", restoId);
        if (!restoId) {
            return res
                .status(400)
                .send({ success: false, message: "Resto id is required" });
        }
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restoId) },
        });
        console.log("Resto", resto);
        if (!resto) {
            return res
                .status(404)
                .send({ success: false, message: "Resto not found" });
        }
        return res.status(200).send({
            success: true,
            message: "Menu version fetched successfully",
            menuVersion: resto.menuVersion,
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getMenuVersion = getMenuVersion;
const resoStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { status } = req.body;
        console.log("Changing restaurant status - ID:", restoId, "Status:", status);
        if (status === undefined || status === null || !restoId) {
            return res
                .status(400)
                .send({ success: false, message: "Status and restoId are required" });
        }
        const resto = yield db_1.default.resto.update({
            where: { id: parseInt(restoId) },
            data: { open: status, menuVersion: { increment: 1 } },
        });
        console.log("Restaurant status updated:", resto);
        return res.status(200).send({
            success: true,
            message: "Resto status changed successfully",
            resto,
        });
    }
    catch (error) {
        console.error("Error changing restaurant status:", error);
        return res.status(500).send({ success: false, message: error });
    }
});
exports.resoStatus = resoStatus;
const changeOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res
                .status(400)
                .send({ success: false, message: "Order ID and status are required" });
        }
        const order = yield db_1.default.order.update({
            where: { id: parseInt(orderId) },
            data: { status },
        });
        return res.status(200).send({
            success: true,
            message: "Order status changed successfully",
            order,
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.changeOrderStatus = changeOrderStatus;
const editMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId } = req.params;
        const { name, price, description, menuId } = req.body;
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restoId) },
        });
        if (!resto) {
            return res
                .status(404)
                .send({ success: false, message: "Resto not found" });
        }
        if (!menuId) {
            return res
                .status(404)
                .send({ success: false, message: "Menu not found" });
        }
        const menu = yield db_1.default.menu.update({
            where: { id: parseInt(menuId) },
            data: { name, price: parseFloat(price), description },
        });
        yield db_1.default.resto.update({
            where: { id: parseInt(restoId) },
            data: { menuVersion: resto.menuVersion + 1 },
        });
        return res
            .status(200)
            .send({ success: true, message: "Menu updated successfully", menu });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.editMenu = editMenu;
const deleteMenu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restoId, menuId } = req.params;
        const resto = yield db_1.default.resto.findUnique({
            where: { id: parseInt(restoId) },
        });
        if (!resto) {
            return res
                .status(404)
                .send({ success: false, message: "Resto not found" });
        }
        const menu = yield db_1.default.menu.delete({
            where: { id: parseInt(menuId) },
        });
        yield db_1.default.resto.update({
            where: { id: parseInt(restoId) },
            data: { menuVersion: resto.menuVersion + 1 },
        });
        return res
            .status(200)
            .send({ success: true, message: "Menu item deleted successfully", menu });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.deleteMenu = deleteMenu;
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Assume all restos belong to this admin instance; extend with real auth if needed
        const restosPromise = db_1.default.resto.findMany({
            select: { id: true, name: true, location: true, number: true },
        });
        // Month range (local)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        // Today range (local)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        // Use DB aggregations for month/today
        const monthlyAggPromise = db_1.default.order.aggregate({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
            _count: { _all: true },
            _sum: { totalPrice: true },
        });
        const todayAggPromise = db_1.default.order.aggregate({
            where: { createdAt: { gte: todayStart, lt: todayEnd } },
            _count: { _all: true },
            _sum: { totalPrice: true },
        });
        // For per-resto cumulative totals, fetch minimal fields and attribute by first item's restoId
        const minimalOrdersPromise = db_1.default.order.findMany({
            select: {
                id: true,
                totalPrice: true,
                createdAt: true,
                orderItems: {
                    select: { menu: { select: { restoId: true } } },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const [restos, monthlyAgg, todayAgg, minimalOrders] = yield Promise.all([
            restosPromise,
            monthlyAggPromise,
            todayAggPromise,
            minimalOrdersPromise,
        ]);
        const restoTotals = {};
        for (const o of minimalOrders) {
            const rid = (_d = (_c = (_b = (_a = o.orderItems) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.menu) === null || _c === void 0 ? void 0 : _c.restoId) !== null && _d !== void 0 ? _d : undefined;
            if (!rid)
                continue;
            if (!restoTotals[rid])
                restoTotals[rid] = { totalOrders: 0, totalRevenue: 0 };
            restoTotals[rid].totalOrders += 1;
            restoTotals[rid].totalRevenue += o.totalPrice || 0;
        }
        const restaurants = restos.map((r) => {
            var _a, _b;
            return ({
                id: r.id,
                name: r.name,
                location: r.location,
                number: r.number,
                totalOrders: ((_a = restoTotals[r.id]) === null || _a === void 0 ? void 0 : _a.totalOrders) || 0,
                totalRevenue: ((_b = restoTotals[r.id]) === null || _b === void 0 ? void 0 : _b.totalRevenue) || 0,
            });
        });
        return res.status(200).send({
            success: true,
            data: {
                restaurants,
                monthly: {
                    totalOrders: monthlyAgg._count._all || 0,
                    totalRevenue: monthlyAgg._sum.totalPrice || 0,
                },
                today: {
                    totalOrders: todayAgg._count._all || 0,
                    totalRevenue: todayAgg._sum.totalPrice || 0,
                },
            },
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, message: error });
    }
});
exports.getDashboardStats = getDashboardStats;
