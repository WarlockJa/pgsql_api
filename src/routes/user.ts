import express from "express";
const userRouter = express.Router();
import userController from '../controllers/userController.js';

userRouter.route('/')
    .post(userController.confirmEmail)
    .delete(userController.deleteUser);

export default userRouter;