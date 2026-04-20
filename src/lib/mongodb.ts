import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return true;
  }

  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is missing in .env.local. Database connection skipped.");
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    isConnected = true;
    console.log("✅ MongoDB Connected");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    return false;
  }
}
