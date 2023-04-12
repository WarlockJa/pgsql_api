import express from "express";
const userRouter = express.Router();
import userController from '../controllers/userController.js';
userRouter.route('/')
    .get(userController.logoutUser)
    .post(userController.updateUser)
    .put(userController.confirmUser)
    .delete(userController.deleteUser);
export default userRouter;
//# sourceMappingURL=user.js.map