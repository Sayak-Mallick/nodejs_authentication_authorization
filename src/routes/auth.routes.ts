import { Router } from "express";
import { loginHandler, registerHandler, verifyEmailHandler } from "../controllers/auth/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/verify-email", verifyEmailHandler);

export default authRouter;