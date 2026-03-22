import express, { Application } from "express";
import cookieParser from "cookie-parser";
const app: Application = express();

app.use(express.json()); // inbuilt middleware to parse the json request body to req.body
app.use(cookieParser()); // inbuilt middleware to parse the cookie request body to req.cookies

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

export default app;
