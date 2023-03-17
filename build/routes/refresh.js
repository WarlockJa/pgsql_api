import express from 'express';
const refreshRoute = express.Router();
import refreshController from '../controllers/refreshController.js';
refreshRoute.get('/', refreshController.refreshToken);
export default refreshRoute;
//# sourceMappingURL=refresh.js.map