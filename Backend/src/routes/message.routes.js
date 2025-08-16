import express from "express";
import { getAllUsers, getChatHistory } from "../controllers/message.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const meesageRouter = express.Router();

meesageRouter.get("/users", isAuthenticated , getAllUsers)
meesageRouter.get("/:sender_id/:receiver_id",isAuthenticated, getChatHistory);


export default meesageRouter;
