import { connectToDB } from "./config/db";
import dotenv from "dotenv";
import http from "node:http";
import app from "./app";
import createHttpError from "http-errors";
dotenv.config();

async function startServer() {
  await connectToDB();
  const server = http.createServer(app);
  server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}

startServer().catch((err) => {
  console.log(err);
  process.exit(1);
});
