import express from "express";
const userRouter = express.Router();
import userController from '../controllers/userController.js';
userRouter.route('/')
    .post(userController.confirmUser)
    .put(userController.updateUser)
    .delete(userController.deleteUser);
export default userRouter;
//# sourceMappingURL=user.js.map