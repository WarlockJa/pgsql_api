import express from "express";
const userRouter = express.Router();
import userController from '../controllers/userController.js';
userRouter.route('/')
    .get(userController.getUserIdToken);
export default userRouter;
//# sourceMappingURL=user.js.map