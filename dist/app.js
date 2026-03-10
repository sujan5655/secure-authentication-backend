"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://www.sujan-chaudhary.com.np",
        "https://sujan-chaudhary.com.np",
        "https://secured-authentication-system-dm6a.vercel.app",
    ],
    credentials: true,
}));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set secure: true if using HTTPS
}));
app.use(express_1.default.json());
const authRoute_1 = __importDefault(require("./route/globals/auth/authRoute"));
const adminRoute_1 = __importDefault(require("./route/globals/auth/adminRoute"));
const userRoute_1 = __importDefault(require("./route/globals/auth/userRoute"));
app.use("/api", authRoute_1.default);
app.use("/api/user", userRoute_1.default);
app.use("/api/admin", adminRoute_1.default);
exports.default = app;
