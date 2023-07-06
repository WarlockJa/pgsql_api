import express from 'express';
const refreshRouter = express.Router();
import refreshController from '../controllers/refreshController.js';

refreshRouter.get('/', refreshController.refreshToken);

export default refreshRouter;