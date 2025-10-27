"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const adminController_1 = require("../controller/adminController");
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
const uploadMiddleware = upload.single('image');
router.post("/createResto", adminController_1.createResto);
router.get("/allResto", adminController_1.allResto);
router.post("/resto/:restoId/addMenu", uploadMiddleware, adminController_1.addMenu);
router.get("/resto/:restoId/dailyRevenue", adminController_1.getDailyRevenue);
router.post("/resto/:restoId/orderHistory", adminController_1.restoOrderHistory);
router.post("/resto/:restoId/deliveredOrders", adminController_1.deliveredOrdersForDay);
router.post("/resto/:restoId/runAds", adminController_1.runAds);
router.get("/resto/:restoId/getAds", adminController_1.getAds);
router.delete("/resto/:restoId/deleteAds", adminController_1.deleteAds);
router.post("/changestatus", adminController_1.changeMenuStatus);
router.get("/resto/:restoId/getMenuVersion", adminController_1.getMenuVersion);
router.post("/order/changestatus", adminController_1.changeOrderStatus);
router.post("/resto/:restoId/editMenu", adminController_1.editMenu);
router.delete("/resto/:restoId/menu/:menuId", adminController_1.deleteMenu);
router.get("/dashboard/stats", adminController_1.getDashboardStats);
router.get("/resto/:restaurantId/analytics", adminController_1.getRestaurantAnalytics);
router.get("/analytics", adminController_1.getAdminAnalytics);
router.post("/resto/:restoId/changeStatus", adminController_1.resoStatus);
exports.default = router;
