import { config } from "dotenv";
config();

const allowedOrigin = [
  process.env.ALLOWED_ORIGIN_PROD,
  process.env.ALLOWED_ORIGIN_DEV,
  process.env.BASE_URI,
];

export default allowedOrigin;
