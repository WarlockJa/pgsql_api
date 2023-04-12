import express from "express";
const authRouter = express.Router();
import authController from '../controllers/authController.js';
authRouter.route('/')
    .get(authController.reauthUser)
    // .put(authController.logoutUser)
    .post(authController.authUser);
export default authRouter;
//# sourceMappingURL=auth.js.map