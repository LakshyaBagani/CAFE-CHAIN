import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/db";
import generateToken from "../utils/token";
import mailOption from "../utils/mailOptions";
import brevoClient, { hasBrevoApiKey, brevoApiKeySource } from "../config/brevo";
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
        
        res.clearCookie("jwt")
        res.clearCookie("adminSession")
        
        return res.status(200).send({success:true , message:"User log out successfully"})
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send({success:false , message:error})
    }
}

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const startTs = Date.now();
    

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    console.time("[OTP] prisma.user.findUnique");
    const existingUser = await prisma.user.findUnique({ where: { email: email } });
    console.timeEnd("[OTP] prisma.user.findUnique");


    if (!existingUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found. Please sign up first." });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    // Update user with OTP code
    console.time("[OTP] prisma.user.update(OTPCode)");
    await prisma.user.update({ where: { email: email }, data: { OTPCode: verificationCode } });
    console.timeEnd("[OTP] prisma.user.update(OTPCode)");

    if (!process.env.SENDER_EMAIL || !hasBrevoApiKey) {
      console.error("[OTP] Email configuration missing.", {
        hasSenderEmail: !!process.env.SENDER_EMAIL,
        hasBrevoKey: hasBrevoApiKey,
        brevoKeySource: brevoApiKeySource,
      });
      return res
        .status(500)
        .send({ success: false, message: "Email service not configured. Please contact support." });
    }


    const mailOptions = mailOption(email, verificationCode);

    const sendSmtpEmail: any = {
      sender: { email: process.env.SENDER_EMAIL, name: "Sojo's Cafe" },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
    };

    try {
      console.time("[OTP] brevo.sendTransacEmail");
      const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
      console.timeEnd("[OTP] brevo.sendTransacEmail");
    } catch (e) {
      const err = e as any;
      console.error("[Email] Brevo send failed:", {
        message: err?.message,
        code: err?.code,
        responseData: err?.response?.body || err?.response?.data,
        stack: err?.stack,
      });
      return res.status(500).send({ success: false, message: "Failed to send OTP. Please try again." });
    }
    
    
    return res
      .status(200)
      .send({ success: true, message: "OTP sent successfully! Check your email." });
      
  } catch (error) {
    console.error("[OTP] Uncaught error:", error);
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
