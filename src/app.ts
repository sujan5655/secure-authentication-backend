import express from "express";
const app = express();
import cors from "cors";
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
import session from "express-session";
import dotenv from "dotenv"
dotenv.config()
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set secure: true if using HTTPS
}));

app.use(express.json());
import authRoute from "./route/globals/auth/authRoute";
import adminRoute from "./route/globals/auth/adminRoute";
import userRoute from "./route/globals/auth/userRoute";
app.use("/api", authRoute);
app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
export default app;
