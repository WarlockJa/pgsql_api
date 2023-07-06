// Cross Origin Resource Sharing
import { CorsOptions } from "cors";
import allowedOrigin from "./allowedOrigin.js";
// corsOptions from the documentation
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback) => {
    if (allowedOrigin.indexOf(origin) !== -1) {
      // !origin for localhost testing
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

export default corsOptions;
