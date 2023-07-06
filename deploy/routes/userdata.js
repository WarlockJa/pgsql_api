import express from "express";
const userdataRouter = express.Router();
import userdataController from '../controllers/userdataController.js';
userdataRouter.route('/')
    .get(userdataController.getGeodata);
export default userdataRouter;
//# sourceMappingURL=userdata.js.map