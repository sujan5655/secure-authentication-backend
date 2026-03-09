"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const app_1 = __importDefault(require("./app"));
const connection_1 = __importDefault(require("./database/connection"));
const server = (0, express_1.default)();
// ✅ Apply middleware before routes
server.use((0, cors_1.default)({
    origin: "https://www.sujan-chaudhary.com.np", // your React frontend
    credentials: true,
}));
server.use(body_parser_1.default.json());
server.use(express_1.default.json());
// ✅ Configure express-session globally
server.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true if using https
        httpOnly: true,
        sameSite: "lax",
    },
}));
// ✅ Mount your app (which contains routes like /api/captcha)
server.use(app_1.default);
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, connection_1.default)();
            const port = process.env.PORT || 8000;
            server.listen(port, () => {
                console.log(`✅ Server running at http://localhost:${port}`);
            });
        }
        catch (error) {
            console.error("❌ Failed to start server:", error);
        }
    });
}
startServer();
