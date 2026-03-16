"use strict";
// import { config } from "dotenv";
// config();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express from "express";
// import cors from "cors";
// import session from "express-session";
// import bodyParser from "body-parser";
// import app from "./app";
// import connectMongoDB from "./database/connection";
// const server = express();
// // ✅ Apply middleware before routes
// server.use(
//   cors({
//     origin: "https://www.sujan-chaudhary.com.np", // your React frontend
//     credentials: true,
//   })
// );
// server.use(bodyParser.json());
// server.use(express.json());
// // ✅ Configure express-session globally
// server.use(
//   session({
//     secret: process.env.SESSION_SECRET || "super_secret_key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: false, // true if using https
//       httpOnly: true,
//       sameSite: "lax",
//     },
//   })
// );
// // ✅ Mount your app (which contains routes like /api/captcha)
// server.use(app);
// async function startServer() {
//   try {
//     await connectMongoDB();
//     const port = process.env.PORT || 8000;
//     server.listen(port, () => {
//       console.log(`✅ Server running at http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//   }
// }
// startServer();
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const app_1 = __importDefault(require("./app"));
const connection_1 = __importDefault(require("./database/connection"));
const server = (0, express_1.default)();
server.use((0, cors_1.default)({
    origin: [
        "https://www.sujan-chaudhary.com.np",
        "https://sujan-chaudhary.com.np",
        "http://localhost:5173"
    ],
    credentials: true,
}));
server.use(body_parser_1.default.json());
server.use(express_1.default.json());
server.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
    },
}));
server.use(app_1.default);
// connect database
(0, connection_1.default)();
// ❗ DO NOT use server.listen()
exports.default = server;
