import express from "express";
const authGoogleRouter = express.Router();
import authGoogleController from '../controllers/authGoogleController.js';

authGoogleRouter.route('/')
    .post(authGoogleController.authGoogleUser)

export default authGoogleRouter;