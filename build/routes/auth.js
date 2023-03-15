import express from "express";
const authRouter = express.Router();
import authController from '../controllers/authController.js';
authRouter.route('/')
    .post(authController.authUser);
export default authRouter;
//# sourceMappingURL=auth.js.map