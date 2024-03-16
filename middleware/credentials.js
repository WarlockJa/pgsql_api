import allowedOrigin from "../config/allowedOrigin.js";
const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigin.includes(origin)) {
    res.header({ "Access-Control-Allow-Credentials": true });
    res.header({ "Access-Control-Allow-Origin": origin });
  }
  next();
};
export default credentials;
//# sourceMappingURL=credentials.js.map
