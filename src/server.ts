import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";
import session from "express-session";
import bodyParser from "body-parser";

import app from "./app";
import connectMongoDB from "./database/connection";

const server = express();

// ✅ Apply middleware before routes
server.use(
  cors({
    origin: "https://www.sujan-chaudhary.com.np", // your React frontend
    credentials: true,
  })
);

server.use(bodyParser.json());
server.use(express.json());

// ✅ Configure express-session globally
server.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true if using https
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// ✅ Mount your app (which contains routes like /api/captcha)
server.use(app);

async function startServer() {
  try {
    await connectMongoDB();

    const port = process.env.PORT || 8000;
    server.listen(port, () => {
      console.log(`✅ Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

startServer();
