import express from "express";
const registerRouter = express.Router();
import registerController from "../controllers/registerController.js";
registerRouter
  .route("/")
  // TODO GET route is for testing only!
  // .get(registerController.getUsers)
  .post(registerController.registerUser);
export default registerRouter;
//# sourceMappingURL=register.js.map
