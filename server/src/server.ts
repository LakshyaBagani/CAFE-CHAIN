import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoute from "./routes/authRoute";
import adminRoute from "./routes/adminRoute";
import userRoute from "./routes/userRoute";
import cors from "cors";
import prisma from "./config/db";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["https://cafe-chain.vercel.app" , "http://localhost:5173" , "https://sojo-cafe.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));


app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/user', userRoute);

app.post('/pixeltrace', async (req, res) => {
  try {
    const { name, email, number, college } = req.body;
    const pixelTrace = await prisma.pixelTrace.create({
      data: { name, email, number, college }
    });
    return res.status(200).send({ success: true, message: "Registered successfully", pixelTrace });
  } catch (error) {
    return res.status(500).send({ success: false, message: error });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
