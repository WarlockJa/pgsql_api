import express from "express";
const verifyEmailRouter = express.Router();
import verifyEmailController from "../controllers/verifyEmailController.js";
verifyEmailRouter.route("/:email/:token").get(verifyEmailController.verifyUser);
export default verifyEmailRouter;
//# sourceMappingURL=verifyEmail.js.map
