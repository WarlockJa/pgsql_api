import allowedOrigin from "./allowedOrigin.js";
// corsOptions from the documentation
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigin.indexOf(origin) !== -1) {
            // !origin for localhost testing
            callback(null, origin);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200,
};
export default corsOptions;
//# sourceMappingURL=corsOptions.js.map