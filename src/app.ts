import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import authRouter from "./routes/auth.routes";
const app: Application = express();

app.use(express.json()); // inbuilt middleware to parse the json request body to req.body
app.use(cookieParser()); // inbuilt middleware to parse the cookie request body to req.cookies

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/auth", authRouter);

// Global error handler middleware should be the last middleware
app.use(globalErrorHandler);

export default app;
