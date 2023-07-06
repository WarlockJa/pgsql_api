import express from "express";
const registerRouter = express.Router();
import registerController from '../controllers/registerController.js';

registerRouter.route('/')
    .get(registerController.getUsers)
    .post(registerController.registerUser)

export default registerRouter;