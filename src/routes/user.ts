import express from "express";
const userRouter = express.Router();
import userController from '../controllers/userController.js';

userRouter.route('/')
    .get(userController.getUser)
    .post(userController.updateUser)
    .put(userController.confirmUser)
    .delete(userController.deleteUser);

export default userRouter;