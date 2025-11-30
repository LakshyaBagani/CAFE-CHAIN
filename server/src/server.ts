import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoute from "./routes/authRoute";
import adminRoute from "./routes/adminRoute";
import userRoute from "./routes/userRoute";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["https://cafe-chain.vercel.app" , "http://localhost:5173" , "https://sojo-cafe.vercel.app" , "http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));


app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/user', userRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
