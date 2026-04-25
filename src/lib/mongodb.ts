import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is missing. Database connection skipped.");
    return false;
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // Connecting in progress — wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    return (mongoose.connection.readyState as number) === 1;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    return false;
  }
}
