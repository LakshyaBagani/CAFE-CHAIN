import express from "express"
import { Login, Logout, Signup , verifyOTP , resetPassword , sendOTP } from "../controller/authController";

const router = express.Router();

router.post('/login' , Login);
router.post('/signup' , Signup);
router.post('/logout' , Logout)
router.post('/sendOTP' , sendOTP)
router.post('/verifyOTP' , verifyOTP)
router.post('/resetPassword' , resetPassword)

export default router