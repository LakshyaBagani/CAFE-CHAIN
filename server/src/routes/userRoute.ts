import { Router } from "express";
import AuthProtect from "../middleware/authProtect";
import { getOrders, addWalletBalance, getWalletBalance , createOrder , allMenu , userInfo , fetchWalletHistory} from "../controller/userController";

const router = Router();

router.post("/resto/:restoId/order", AuthProtect , createOrder);
router.get("/resto/:restoId/menu", AuthProtect , allMenu);
router.get('/orderHistory', AuthProtect , getOrders);
router.post('/addWalletBalance', AuthProtect , addWalletBalance);
router.get('/getWalletBalance', AuthProtect , getWalletBalance);
router.get('/userInfo', AuthProtect , userInfo);
router.get('/walletHistory', AuthProtect , fetchWalletHistory);

export default router;