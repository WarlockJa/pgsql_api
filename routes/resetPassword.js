import express from "express";
const resetPassword = express.Router();
import resetPasswordController from "../controllers/resetPasswordController.js";
resetPassword
    .route("/:email/:token")
    .get(resetPasswordController.resetPassword);
export default resetPassword;
//# sourceMappingURL=resetPassword.js.map