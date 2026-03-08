// db/mongo.connection.ts
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/users'; // Force IPv4

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI); // No extra options needed in Mongoose v7+

    console.log('✅ Connected to MongoDB Database');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
