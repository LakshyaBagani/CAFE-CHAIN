import { Request, Response } from "express";
import prisma from "../config/db";
import { supabase } from "../config/supabaseConfig";
import bcrypt from "bcrypt";
import path from "path";

export const createResto = async (req: Request, res: Response) => {
  const { name, location, number } = req.body;
  try {
    const email = `${number}@gmail.com`;
    const password = `${number}@payment`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!name || !location || !number) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }

    const existingResto = await prisma.resto.findUnique({ where: { number } });

    if (existingResto) {
      return res
        .status(400)
        .send({ success: false, message: "Resto already exists" });
    }

    const resto = await prisma.resto.create({
      data: { name, location, number, email, password: hashedPassword },
    });
    return res
      .status(200)
      .send({ success: true, message: "Resto created successfully" });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const allResto = async (req: Request, res: Response) => {
  try {
    const resto = await prisma.resto.findMany();
    if (!resto) {
      return res
        .status(400)
        .send({ success: false, message: "No resto found" });
    }
    return res
      .status(200)
      .send({
        success: true,
        message: "All resto fetched successfully",
        resto,
      });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const addMenu = async (req: Request, res: Response) => {
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

    const resto = await prisma.resto.findUnique({
      where: { id: parseInt(restoId) },
    });

    if (!resto) {
      return res.status(404).send({
        success: false,
        message: "Restaurant not found",
      });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
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

    const {
      data: { publicUrl },
    } = supabase.storage.from("Menu_Images").getPublicUrl(fileName);

    const menuItem = await prisma.menu.create({
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

    await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });

    return res.status(200).send({
      success: true,
      message: "Menu item added successfully",
      menuItem,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getDailyRevenue = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { date } = req.body;

    if (!date) {
      return res
        .status(400)
        .send({
          success: false,
          message: "Date is required (format: YYYY-MM-DD)",
        });
    }

    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const orders = await prisma.order.findMany({
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

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
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
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const restoOrderHistory = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { date } = req.body;


    if (!date) {
      return res
        .status(400)
        .send({ success: false, message: "Date is required" });
    }

    const orders = await prisma.order.findMany({
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
    });

    const restaurantOrders = orders.filter((order) =>
      order.orderItems.some((item) => item.menu.restoId === parseInt(restoId))
    );

    const dateFilteredOrders = restaurantOrders.filter((order) => {
      // Use UTC date formatting to match database timezone
      const orderDate = new Date(order.createdAt);
      const year = orderDate.getUTCFullYear();
      const month = String(orderDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getUTCDate()).padStart(2, '0');
      const formattedOrderDate = `${year}-${month}-${day}`;
      
      
      return formattedOrderDate === date;
    });

    // Convert BigInt to string for JSON safety
    const safeOrders = dateFilteredOrders.map((o: any) => ({
      ...o,
      user: o.user ? { ...o.user, number: o.user?.number?.toString?.() } : o.user,
    }));

    return res.status(200).send({
      success: true,
      message: "Order history fetched successfully",
      orders: safeOrders,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const deliveredOrdersForDay = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { date } = req.body as { date?: string };

    if (!date) {
      return res.status(400).send({ success: false, message: "Date is required (YYYY-MM-DD)" });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        status: 'Delivered',
        createdAt: { gte: startDate, lt: endDate },
        orderItems: {
          some: { menu: { restoId: parseInt(restoId) } }
        }
      },
      include: {
        orderItems: { include: { menu: true } },
        user: { select: { id: true, name: true, email: true, number: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const safeOrders = orders.map((o: any) => ({
      ...o,
      user: o.user ? { ...o.user, number: o.user?.number?.toString?.() } : o.user,
    }));

    return res.status(200).send({ success: true, message: 'Delivered orders fetched successfully', orders: safeOrders });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const runAds = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { menuName, discount } = req.body;

    const menu = await prisma.menu.findFirst({
      where: { name: menuName },
    });

    if (!menu) {
      return res
        .status(404)
        .send({ success: false, message: "Menu not found" });
    }

    const ads = await prisma.ads.create({
      data: {
        restoId: parseInt(restoId),
        menuId: menu.id,
        discount: parseInt(discount),
      },
    });

    return res
      .status(200)
      .send({ success: true, message: "Ads created successfully", ads });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const getAds = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const ads = await prisma.ads.findMany({
      where: { restoId: parseInt(restoId) },
    });
    return res
      .status(200)
      .send({ success: true, message: "Ads fetched successfully", ads });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const deleteAds = async (req: Request, res: Response) => {
  try {
    const { adsId } = req.body;
    const ads = await prisma.ads.delete({
      where: { id: parseInt(adsId) },
    });
    return res
      .status(200)
      .send({ success: true, message: "Ads deleted successfully", ads });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const changeMenuStatus = async (req: Request, res: Response) => {
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

    const resto = await prisma.resto.findUnique({
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
      
      const menu = await prisma.menu.update({
        where: { id: parseInt(menuId) },
        data: { availability: status },
      });

      await prisma.resto.update({
        where: { id: parseInt(actualRestoId) },
        data: { menuVersion: resto.menuVersion + 1 },
      });

      return res
        .status(200)
        .send({ success: true, message: "Menu availability changed successfully", menu });
    }

    // Handle order status change (existing functionality)
    if (!status || !orderId) {
      return res
        .status(400)
        .send({ success: false, message: "Status and orderId are required" });
    }
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
    });

    await prisma.resto.update({
      where: { id: parseInt(actualRestoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });

    return res
      .status(200)
      .send({ success: true, message: "Status changed successfully", order });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const getMenuVersion = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    if (!restoId) {
      return res
        .status(400)
        .send({ success: false, message: "Resto id is required" });
    }
    const resto = await prisma.resto.findUnique({
      where: { id: parseInt(restoId) },
    });
    if (!resto) {
      return res
        .status(404)
        .send({ success: false, message: "Resto not found" });
    }
    return res
      .status(200)
      .send({
        success: true,
        message: "Menu version fetched successfully",
        menuVersion: resto.menuVersion,
      });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const resoStatus = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { status } = req.body;

    if (status === undefined || status === null || !restoId) {
      return res
        .status(400)
        .send({ success: false, message: "Status and restoId are required" });
    }
    const resto = await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { open: status },
    });
    return res
      .status(200)
      .send({
        success: true,
        message: "Resto status changed successfully",
        resto,
      });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const changeOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).send({ success: false, message: "Order ID and status are required" });
    }
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
    });
    return res.status(200).send({ success: true, message: "Order status changed successfully", order });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const editMenu = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { name, price, description , menuId } = req.body;
    const resto = await prisma.resto.findUnique({
      where: { id: parseInt(restoId) },
    });
    if (!resto) {
      return res.status(404).send({ success: false, message: "Resto not found" });
    }
    if (!menuId) {
      return res.status(404).send({ success: false, message: "Menu not found" });
    }
    const menu = await prisma.menu.update({
      where: { id: parseInt(menuId) },
      data: { name, price: parseFloat(price), description },
    });

    await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });
    return res.status(200).send({ success: true, message: "Menu updated successfully", menu  });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const { restoId, menuId } = req.params;
    const resto = await prisma.resto.findUnique({
      where: { id: parseInt(restoId) },
    });
    if (!resto) {
      return res.status(404).send({ success: false, message: "Resto not found" });
    }
    
    const menu = await prisma.menu.delete({
      where: { id: parseInt(menuId) },
    });

    await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });
    return res.status(200).send({ success: true, message: "Menu item deleted successfully", menu });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Assume all restos belong to this admin instance; extend with real auth if needed
    const restosPromise = prisma.resto.findMany({ select: { id: true, name: true, location: true, number: true } });

    // Month range (local)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Today range (local)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Use DB aggregations for month/today
    const monthlyAggPromise = prisma.order.aggregate({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    });

    const todayAggPromise = prisma.order.aggregate({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    });

    // For per-resto cumulative totals, fetch minimal fields and attribute by first item's restoId
    const minimalOrdersPromise = prisma.order.findMany({
      select: {
        id: true,
        totalPrice: true,
        createdAt: true,
        orderItems: {
          select: { menu: { select: { restoId: true } } },
          take: 1
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const [restos, monthlyAgg, todayAgg, minimalOrders] = await Promise.all([
      restosPromise,
      monthlyAggPromise,
      todayAggPromise,
      minimalOrdersPromise,
    ]);

    const restoTotals: Record<number, { totalOrders: number; totalRevenue: number }> = {};
    for (const o of minimalOrders) {
      const rid = (o.orderItems?.[0]?.menu?.restoId as number | undefined) ?? undefined;
      if (!rid) continue;
      if (!restoTotals[rid]) restoTotals[rid] = { totalOrders: 0, totalRevenue: 0 };
      restoTotals[rid].totalOrders += 1;
      restoTotals[rid].totalRevenue += o.totalPrice || 0;
    }

    const restaurants = restos.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      number: r.number,
      totalOrders: restoTotals[r.id]?.totalOrders || 0,
      totalRevenue: restoTotals[r.id]?.totalRevenue || 0,
    }));

    return res.status(200).send({
      success: true,
      data: {
        restaurants,
        monthly: { totalOrders: monthlyAgg._count._all || 0, totalRevenue: monthlyAgg._sum.totalPrice || 0 },
        today: { totalOrders: todayAgg._count._all || 0, totalRevenue: todayAgg._sum.totalPrice || 0 },
      }
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};
