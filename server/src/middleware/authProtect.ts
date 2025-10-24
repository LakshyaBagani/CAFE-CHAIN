import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    userId?: number;
    isAdmin?: boolean;
  }

  const authProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.jwt;
  
      if (!process.env.MY_SERCET_KEY) {
        throw new Error("JWT secret key undefined");
      }
  
      if (!token) {
        return res.status(401).send({ success: false, message: "No token provided" });
      }
  
      const decode = jwt.verify(token, process.env.MY_SERCET_KEY) as { userId: number, isAdmin?: boolean };
      req.userId = decode.userId;
      req.isAdmin = decode.isAdmin;
  
      next();
    } catch (error) {
      res.status(401).send({ success: false, message: "Invalid or expired token" });
    }
  };
  
  export default authProtect;
  export type { AuthRequest };