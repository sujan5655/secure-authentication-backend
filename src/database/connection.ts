// db/mongo.connection.ts
import mongoose from 'mongoose';

// Read MongoDB connection string from environment (.env / Render env)
const MONGO_URI = process.env.MONGO_URI as string;

const connectMongoDB = async (): Promise<void> => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }

    await mongoose.connect(MONGO_URI); // No extra options needed in Mongoose v7+

    console.log('✅ Connected to MongoDB Database');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
