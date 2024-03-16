import allowedOrigin from "./allowedOrigin.js";
// corsOptions from the documentation
const corsOptions = {
  origin: (origin, callback) => {
    // TEST
    // callback(null, origin);
    if (allowedOrigin.indexOf(origin) !== -1) {
      console.log("PASSED: ", allowedOrigin);
      // !origin for localhost testing
      callback(null, origin);
    } else {
      console.log("FAILED: ", allowedOrigin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
export default corsOptions;
//# sourceMappingURL=corsOptions.js.map
