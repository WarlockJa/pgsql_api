import express from "express";
const passwordRouter = express.Router();
import passwordController from "../controllers/passwordController.js";

passwordRouter.route("/").put(passwordController.resetPassword);

export default passwordRouter;
