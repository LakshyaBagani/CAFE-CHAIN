import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authProtect";
import prisma from "../config/db";

export const createOrder = async (req: AuthRequest, res: Response) => {
  const {totalPrice, orderItems , paymentMethod , deliveryType } = req.body;
  const userId = req.userId;
  const restoId = req.params.restoId;
  
  try {
    if(!totalPrice || !orderItems || !restoId || !userId){
      return res.status(400).send({ success: false, message: "All fields are required" });
    }

    const order = await prisma.order.create({
      data: { userId, totalPrice: parseInt(totalPrice) , paymentMethod , deliveryType , restoId: parseInt(restoId) },
    });

    for(let i = 0; i < orderItems.length; i++){
      const { dishName, quantity } = orderItems[i];
      
      const menuItem = await prisma.menu.findFirst({
        where: { name: dishName }
      });

      if (!menuItem) {
        return res.status(404).send({ 
          success: false, 
          message: `Menu item '${dishName}' not found` 
        });
      }

      // Create order item
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuId: menuItem.id,
          quantity: parseInt(quantity)
        }
      });
    }

    return res.status(200).send({ success: true, message: "Order created successfully", order });
  } catch (error) {
    return res.status(500).send({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export const getOrders = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  try {
    const orders = await prisma.order.findMany({ 
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
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}

export const allMenu = async (req: AuthRequest, res: Response) => {
  const { restoId } = req.params;
  try {
    
    if(!restoId){
      return res.status(400).send({ success: false, message: "Resto ID is required" });
    }

    const menu = await prisma.menu.findMany({ where: { restoId: parseInt(restoId) } });
    
    if(!menu){
      return res.status(400).send({ success: false, message: "Menu not found" });
    }
    
    return res.status(200).send({ success: true, message: "Menu fetched successfully", menu });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}

export const addWalletBalance = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { amount , modeOfPayment } = req.body;
  try {

    if (!userId) {
      return res.status(400).send({ success: false, message: "User ID is required" });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if(!user){
      return res.status(400).send({ success: false, message: "User not found" });
    }

    const userWallet = await prisma.userWallet.create({
      data: { userId, amount: parseInt(amount), modeOfPayment }
    });

    const updatedBalance = user.balance + parseInt(amount);
    await prisma.user.update({ where: { id: userId }, data: { balance: updatedBalance } });

    return res.status(200).send({ success: true, message: "Wallet balance updated successfully", userWallet, balance: updatedBalance });
    
  } catch (error) {
    console.error('Error adding wallet balance:', error);
    return res.status(500).send({ success: false, message: error });
  }
}

export const getWalletBalance = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  try {
    // Only fetch balance field for better performance
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { balance: true }
    });
    if(!user){
      return res.status(400).send({ success: false, message: "User not found" });
    }
    return res.status(200).send({ success: true, message: "Wallet balance fetched successfully", balance: user.balance });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}

export const userInfo = async (req: AuthRequest, res: Response) => {
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
    
    if(!userId){
      return res.status(400).send({ success: false, message: "User ID is required" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if(!user){
      return res.status(400).send({ success: false, message: "User not found" });
    }
    
    const { password, OTPCode, ...userInfo } = user;
    const cleanUser = {
      ...userInfo,
      number: userInfo.number.toString() 
    };
    
    return res.status(200).send({ success: true, message: "User info fetched successfully", user: cleanUser });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}

export const fetchWalletHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  try {
    if(!userId){
      return res.status(400).send({ success: false, message: "User ID is required" });
    }
    
    // Limit to last 20 transactions for better performance
    const history = await prisma.userWallet.findMany({ 
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
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
}
