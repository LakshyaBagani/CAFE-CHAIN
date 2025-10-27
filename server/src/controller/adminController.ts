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
    // Optimized query: Only select needed fields
    const resto = await prisma.resto.findMany({
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
    const dailyStats = await prisma.order.groupBy({
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
    dailyStats.forEach((stat: any) => {
      statsMap.set(stat.restoId, {
        orderCount: stat._count?.id || 0,
        totalRevenue: Number(stat._sum?.totalPrice) || 0,
        date: dateStr
      });
    });

    // Add daily stats to each restaurant
    const restoWithStats = resto.map(restaurant => ({
      ...restaurant,
      dailyStats: statsMap.get(restaurant.id) || {
        orderCount: 0,
        totalRevenue: 0,
        date: dateStr
      }
    }));
    
    return res.status(200).send({
      success: true,
      message: "All resto fetched successfully",
      resto: restoWithStats,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return res.status(500).send({ success: false, message: "Internal server error" });
  }
};

export const getRestaurantAnalytics = async (req: Request, res: Response) => {
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
    const restaurant = await prisma.resto.findUnique({
      where: { id: parseInt(restaurantId) },
      select: { id: true, name: true },
    });

    if (!restaurant) {
      return res
        .status(404)
        .send({ success: false, message: "Restaurant not found" });
    }

    // Get orders for this restaurant in the specified period
    const orders = await prisma.order.findMany({
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
      const restaurantOrderTotal = order.orderItems.reduce(
        (itemSum, item) => itemSum + item.quantity * item.menu.price,
        0
      );
      return sum + restaurantOrderTotal;
    }, 0);

    const totalOrders = orders.length;
    const totalCustomers = new Set(orders.map((order) => order.user.id)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth rate (compare with previous period)
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    );
    const previousOrders = await prisma.order.findMany({
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
      const restaurantOrderTotal = order.orderItems.reduce(
        (itemSum, item) => itemSum + item.quantity * item.menu.price,
        0
      );
      return sum + restaurantOrderTotal;
    }, 0);

    const growthRate =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Get daily sales data
    const dailySalesMap = new Map();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      const orderRevenue = order.orderItems.reduce(
        (sum, item) => sum + item.quantity * item.menu.price,
        0
      );

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
      const customerOrders = orders.filter(
        (order) => order.user.id === customerId
      );
      const firstOrderDate = new Date(
        Math.min(...customerOrders.map((order) => order.createdAt.getTime()))
      );

      if (firstOrderDate >= startDate) {
        newCustomers.add(customerId);
      } else {
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
  } catch (error) {
    console.error("Restaurant analytics error:", error);
    return res
      .status(500)
      .send({
        success: false,
        message: "Failed to fetch restaurant analytics",
      });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    // Calculate date range for last 7 days
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all orders in the specified period
    const orders = await prisma.order.findMany({
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
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
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

    const dailyRevenue = Array.from(dailyRevenueMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

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
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res
      .status(500)
      .send({ success: false, message: "Failed to fetch admin analytics" });
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

export const restoOrderHistory = async (req: Request, res: Response) => {
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

    const orders = await prisma.order.findMany({
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
    const safeOrders = orders.map((o: any) => ({
      ...o,
      user: o.user
        ? { ...o.user, number: o.user?.number?.toString?.() }
        : o.user,
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
      return res
        .status(400)
        .send({ success: false, message: "Date is required (YYYY-MM-DD)" });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const orders = await prisma.order.findMany({
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

    const safeOrders = orders.map((o: any) => ({
      ...o,
      user: o.user
        ? { ...o.user, number: o.user?.number?.toString?.() }
        : o.user,
    }));

    return res.status(200).send({
      success: true,
      message: "Delivered orders fetched successfully",
      orders: safeOrders,
    });
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
    console.log("Resto ID",restoId);
    if (!restoId) {
      return res
        .status(400)
        .send({ success: false, message: "Resto id is required" });
    }
    const resto = await prisma.resto.findUnique({
      where: { id: parseInt(restoId) },
    });
    console.log("Resto",resto);
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
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const resoStatus = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { status } = req.body;
    console.log("Changing restaurant status - ID:", restoId, "Status:", status);

    if (status === undefined || status === null || !restoId) {
      return res
        .status(400)
        .send({ success: false, message: "Status and restoId are required" });
    }
    const resto = await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { open: status, menuVersion: { increment: 1 } },
    });
    console.log("Restaurant status updated:", resto);
    return res.status(200).send({
      success: true,
      message: "Resto status changed successfully",
      resto,
    });
  } catch (error) {
    console.error("Error changing restaurant status:", error);
    return res.status(500).send({ success: false, message: error });
  }
};

export const changeOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .send({ success: false, message: "Order ID and status are required" });
    }
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
    });
    return res.status(200).send({
      success: true,
      message: "Order status changed successfully",
      order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const editMenu = async (req: Request, res: Response) => {
  try {
    const { restoId } = req.params;
    const { name, price, description, menuId } = req.body;
    const resto = await prisma.resto.findUnique({
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
    const menu = await prisma.menu.update({
      where: { id: parseInt(menuId) },
      data: { name, price: parseFloat(price), description },
    });

    await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });
    return res
      .status(200)
      .send({ success: true, message: "Menu updated successfully", menu });
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
      return res
        .status(404)
        .send({ success: false, message: "Resto not found" });
    }

    const menu = await prisma.menu.delete({
      where: { id: parseInt(menuId) },
    });

    await prisma.resto.update({
      where: { id: parseInt(restoId) },
      data: { menuVersion: resto.menuVersion + 1 },
    });
    return res
      .status(200)
      .send({ success: true, message: "Menu item deleted successfully", menu });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Assume all restos belong to this admin instance; extend with real auth if needed
    const restosPromise = prisma.resto.findMany({
      select: { id: true, name: true, location: true, number: true },
    });

    // Month range (local)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Today range (local)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

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
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const [restos, monthlyAgg, todayAgg, minimalOrders] = await Promise.all([
      restosPromise,
      monthlyAggPromise,
      todayAggPromise,
      minimalOrdersPromise,
    ]);

    const restoTotals: Record<
      number,
      { totalOrders: number; totalRevenue: number }
    > = {};
    for (const o of minimalOrders) {
      const rid =
        (o.orderItems?.[0]?.menu?.restoId as number | undefined) ?? undefined;
      if (!rid) continue;
      if (!restoTotals[rid])
        restoTotals[rid] = { totalOrders: 0, totalRevenue: 0 };
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
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
};
