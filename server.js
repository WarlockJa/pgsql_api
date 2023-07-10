import { config } from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import corsOptions from "./config/corsOptions.js";
import cookieParser from "cookie-parser";
import credentials from "./middleware/credentials.js";
import verifyJWT from "./middleware/verifyJWT.js";
import todosRouter from "./routes/todos.js";
import authRouter from "./routes/auth.js";
import registerRouter from "./routes/register.js";
import userRouter from "./routes/user.js";
import authGoogleRouter from "./routes/authgoogle.js";
import verifyEmailRouter from "./routes/verifyEmail.js";
import refreshRouter from "./routes/refresh.js";
import passwordRouter from "./routes/password.js";
import resetPassword from "./routes/resetPassword.js";
config();
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static("public"));
// app.set("views", "./public/views");
app.set("view engine", "pug");

// routes unaffected by cors
// app.get("/", (req, res) => res.send("API is running"));
app.get("^/$|/index(.html)?", (req, res) =>
  res.render("index.pug", {
    root: path.join(__dirname, "public", "views"),
    title: "Daily Planner API",
    dplink: process.env.ALLOWED_ORIGIN_PROD,
  })
); // echo testing route
app.use("/verify", verifyEmailRouter); // route to accept email confirmation requests from a link in email
app.use("/reset", resetPassword); // route to accept password reset requests from a link in email
// middleware
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// routes
// password operations
// PUT: send an e-mail with a reset password link to the provided e-mail
app.use("/password", passwordRouter);
// register a new user
// POST: register a new user
app.use("/register", registerRouter);
// authentication route
// GET: reauthenticate user using client-side stored httpOnly cookie data
// POST: authenticate user using e-mail/password pair
app.use("/auth", authRouter);
// external authentication
// POST: authorize/authenticate user using external source (Google)
app.use("/authgoogle", authGoogleRouter);
// access token refresh route
// GET: refresh access token using refresh token stored in httpOnly cookie
app.use("/refresh", refreshRouter);
app.use(verifyJWT);
// todos routes
// GET: read DB for the list of todos
// POST: add a new todo to the DB
// PUT: update a todo
// DELETE: delete a todo
app.use("/todos", todosRouter);
// user routes
// GET: logout user (remove refresh token from the DB)
// POST: update user data
// PUT: send an e-mail with a link to /verify route that confirms user e-mail
// DELETE: delete user
app.use("/user", userRouter);
app.listen(PORT, () => console.log("Server is running on port ", PORT));
//# sourceMappingURL=server.js.map
