import { IDBUserIdToken, IFrontEndUserIdToken, pool } from "../db/DBConnect.js";
import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { OkPacket } from "mysql2";

interface IAuthUser {
  email: string;
  password: string;
}

const schemaAuthUser = Joi.object<IAuthUser>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST request. Authorize user with email-password pair
const authUser = async (req, res) => {
  // Joi authUser data validation
  const validationResult = await schemaAuthUser.validate(req.body);
  if (validationResult.error)
    return res.status(400).json(validationResult.error.details[0].message);

  // valid data
  const { email, password } = validationResult.value;

  // authorization
  try {
    const result = await pool.execute<OkPacket>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (Array.isArray(result[0]) && result[0].length === 0)
      return res.status(401).json({ message: "user_not_found" });
    const foundUser: IDBUserIdToken = result[0][0];

    // checking if password is correct
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.status(401).json({ message: "password_incorrect" });

    // generating jwt tokens
    const accessToken = jwt.sign(
      { email: foundUser.email },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "600s" }
    );
    const refreshToken = jwt.sign(
      { email: foundUser.email },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" }
    );

    // saving refresh token in DB
    await pool.execute("UPDATE users SET refreshtoken = ? WHERE email = ?", [
      refreshToken,
      email,
    ]);
    // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
    res.cookie("dailyplanner", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    }); //Path: '/refresh', sameSite: 'None', secure: true,

    const idToken: IFrontEndUserIdToken = {
      name: foundUser.name,
      surname: foundUser.surname,
      picture: foundUser.picture,
      email: foundUser.email,
      email_confirmed: foundUser.email_confirmed ? true : false,
      locale: foundUser.locale,
      darkmode: foundUser.darkmode ? true : false,
      authislocal: foundUser.authislocal ? true : false,
      hidecompleted: foundUser.hidecompleted ? true : false,
      widgets: foundUser.widgets,
    };

    // sending access token and id token on authorization success
    // WARNING: keep access token in memory only
    return res.status(200).json({ accessToken, idToken });
  } catch (error) {
    return res.status(500).json({ message: `Cannot access DB ${error.stack}` });
  }
};

// GET request. Authorize user with httpOnly cookie with refresh token from previous session.
const reauthUser = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies.dailyplanner) return res.sendStatus(401);

  const refreshToken = cookies.dailyplanner;

  // checking if refresh token exists in DB
  const result = await pool.execute<OkPacket>(
    "SELECT * FROM users WHERE refreshtoken = ?",
    [refreshToken]
  );
  if (Array.isArray(result[0]) && result[0].length === 0)
    return res
      .status(403)
      .json({ message: "Refresh token not found in DB", status: 403 });
  const foundUser: IDBUserIdToken = result[0][0];

  // verifying refresh token and reissuing both access and refresh tokens
  jwt.verify(
    cookies.dailyplanner,
    process.env.REFRESH_TOKEN_SECRET!,
    async (err, result) => {
      if (err)
        return res.status(403).json({ message: err.message, status: 403 });

      const accessToken = jwt.sign(
        { email: foundUser.email },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "600s" }
      );
      const refreshToken = jwt.sign(
        { email: foundUser.email },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "30d" }
      );

      // saving refresh token in DB
      await pool.query("UPDATE users SET refreshtoken = ? WHERE email = ?", [
        refreshToken,
        foundUser.email,
      ]);

      // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
      res.cookie("dailyplanner", refreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }); //Path: '/refresh', sameSite: 'None', secure: true,

      const idToken: IFrontEndUserIdToken = {
        name: foundUser.name,
        surname: foundUser.surname,
        picture: foundUser.picture,
        email: foundUser.email,
        email_confirmed: foundUser.email_confirmed ? true : false,
        locale: foundUser.locale,
        darkmode: foundUser.darkmode ? true : false,
        authislocal: foundUser.authislocal ? true : false,
        hidecompleted: foundUser.hidecompleted ? true : false,
        widgets: foundUser.widgets,
      };

      // sending renewed access token and a new cookie with refresh token
      return res
        .status(200)
        .json({ data: { accessToken, idToken }, status: 200 });
    }
  );
};

export default { authUser, reauthUser };
