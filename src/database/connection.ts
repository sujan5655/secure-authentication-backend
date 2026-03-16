import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI as string;

let isConnected = false;

const connectMongoDB = async (): Promise<void> => {
  try {
    if (isConnected) {
      return;
    }

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    const db = await mongoose.connect(MONGO_URI);

    isConnected = db.connections[0].readyState === 1;

    console.log("✅ Connected to MongoDB Database");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
  }
};

export default connectMongoDB;