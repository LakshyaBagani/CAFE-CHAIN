import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/db";
import generateToken from "../utils/token";
import mailOption from "../utils/mailOptions";
import transporter from "../config/nodemailer";
import generateAdminToken from "../utils/adminToken";

export const Signup = async (req: Request, res: Response) => {
  const { name, email, password , number } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(409)
        .send({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        number,
      },
    });

    await generateToken(newUser.id, res);

    return res.status(200).send({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
      try {
        await generateAdminToken(res);
      } catch (error) {
        console.error("Error generating admin token:", error);
        return res.status(500).send({ success: false, message: "Admin token generation failed" });
      }
      return res.status(200).send({ success: true, message: "Admin"  });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User does not exists" });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      return res
        .status(401)
        .send({ success: false, message: "Password does not match" });
    }

    await generateToken(user.id, res);
    console.log("Login successful, JWT cookie set for user:", user.id);

    return res.status(200).send({
      success: true,
      message: "User logged in successfully",
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const Logout = async (req:Request,res:Response) => {
    try {
        console.log("Logout endpoint hit - clearing cookies");
        res.clearCookie("jwt")
        res.clearCookie("adminSession")
        console.log("Cookies cleared successfully");
        return res.status(200).send({success:true , message:"User log out successfully"})
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send({success:false , message:error})
    }
}

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });


    if (!existingUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found. Please sign up first." });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    // Update user with OTP code
    await prisma.user.update({
      where: { email: email },
      data: { OTPCode: verificationCode },
    });

    if (!process.env.SMPT_USER || !process.env.SMPT_PASSWORD || !process.env.SENDER_EMAIL) {
      console.error("Email configuration missing. SMPT_USER:", !!process.env.SMPT_USER, "SMPT_PASSWORD:", !!process.env.SMPT_PASSWORD, "SENDER_EMAIL:", !!process.env.SENDER_EMAIL);
      return res
        .status(500)
        .send({ success: false, message: "Email service not configured. Please contact support." });
    }


    const mailOptions = mailOption(email, verificationCode);

    await transporter.sendMail(mailOptions);
    
    return res
      .status(200)
      .send({ success: true, message: "OTP sent successfully! Check your email." });
      
  } catch (error) {
    console.error("OTP sending error:", error);
    return res.status(500).send({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to send OTP. Please try again." 
    });
  }
};

export const verifyOTP = async(req:Request , res:Response)=>{
  try {
    const {verificationCode , email} = req.body

    if(!verificationCode){
      return res.status(400).send({success:false , message:"OTP not received"})
    }

    const user = await prisma.user.findUnique({where:{email}})

    if(!user){
      return res.status(400).send({success:false , message:"User not found"})
    }

    const otp = user.OTPCode

    if(verificationCode != otp){
      return res.status(400).send({success:false , message:"Invalid OTP"})
    }

    await prisma.user.update({
      where: { email: email },
      data: { isVerify : true , OTPCode:"" },
    })

    return res.status(200).send({success:true , message:"Email verified successfully"})

  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}

export const resetPassword = async(req:Request , res:Response)=>{
  try {
    
    const {email ,password , newPassword} = req.body;

    if(!password || !newPassword || !email){
      return res.status(400).send({success:false , message:"Invalid creditentials"})
    }

    const user = await prisma.user.findUnique({where:{email}})

    if(!user){
      return res.status(400).send({success:false , message:"User not found"})
    }

    const verifyPassword = await bcrypt.compare(password , user.password)
    
    if(!verifyPassword){
      return res.status(401).send({success:false , message:"Invalid credientials"})
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email: email },
      data: { password : hashPassword },
    })

    return res
      .status(200)
      .send({ success: true, message: "Password reset successfully" });

  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}
