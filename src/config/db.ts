import mongoose from "mongoose";

export async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Mongodb Connection error", error);
    process.exit(1);
  }
}
