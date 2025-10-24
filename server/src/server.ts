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
  origin: ["http://localhost:5173" , "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));


app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/user', userRoute);

app.listen(3000, () => {
  console.log("Listening on the port 3000");
});
