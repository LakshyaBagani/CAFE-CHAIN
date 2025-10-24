import { Router } from "express";
import multer from "multer";
import { createResto , allResto , addMenu , getDailyRevenue, restoOrderHistory , runAds , getAds , deleteAds, changeMenuStatus , getMenuVersion , changeOrderStatus , editMenu, deleteMenu, deliveredOrdersForDay, getDashboardStats } from "../controller/adminController";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadMiddleware = upload.single('image');


router.post("/createResto", createResto);
router.get("/allResto", allResto);
router.post("/resto/:restoId/addMenu", uploadMiddleware, addMenu);
router.get("/resto/:restoId/dailyRevenue", getDailyRevenue);
router.post("/resto/:restoId/orderHistory", restoOrderHistory);
router.post("/resto/:restoId/deliveredOrders", deliveredOrdersForDay);
router.post("/resto/:restoId/runAds", runAds);
router.get("/resto/:restoId/getAds", getAds);
router.delete("/resto/:restoId/deleteAds", deleteAds);
router.post("/changestatus", changeMenuStatus);
router.get("/resto/:restoId/getMenuVersion", getMenuVersion);
router.post("/order/changestatus", changeOrderStatus);
router.post("/resto/:restoId/editMenu", editMenu);
router.delete("/resto/:restoId/menu/:menuId", deleteMenu);
router.get("/dashboard/stats", getDashboardStats);
  

export default router;