import express from "express";
const registerRouter = express.Router();
import registerController from '../controllers/registerController.js';
registerRouter.route('/')
    .post(registerController.registerUser);
export default registerRouter;
//# sourceMappingURL=register.js.map