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
// db/mongo.connection.ts
const mongoose_1 = __importDefault(require("mongoose"));
// Read MongoDB connection string from environment (.env / Render env)
const MONGO_URI = process.env.MONGO_URI;
const connectMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not set');
        }
        yield mongoose_1.default.connect(MONGO_URI); // No extra options needed in Mongoose v7+
        console.log('✅ Connected to MongoDB Database');
    }
    catch (error) {
        console.error('❌ MongoDB Connection Failed:', error);
        process.exit(1);
    }
});
exports.default = connectMongoDB;
