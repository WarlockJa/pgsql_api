import { OkPacket } from "mysql2";
import { pool } from "../db/DBConnect.js";
import compareTimestamps from "../util/compareTimestamps.js";
import path from "path";
import { fileURLToPath } from "url";
import Joi from "joi";
import bcrypt from "bcrypt";
import getRandomPassword from "../util/getRandomPassword.js";
import getUserLanguage from "../util/getUserLanguage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IVerifyDBRecord {
  email: string; // user email
  token: string; // user email verification token
  ts: string; // verification token timestamp
}

interface IResetPassword {
  email: string;
  token: string;
}

const schemaResetPassword = Joi.object<IResetPassword>({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
});

const resetPassword = async (req, res) => {
  // Joi validation
  const validationResult = await schemaResetPassword.validate(req.params);
  if (validationResult.error)
    return res.status(400).json(validationResult.error.details[0].message);
  // valid fields
  const { email, token } = validationResult.value;

  try {
    // getting email verification data stored in DB
    const result = await pool.execute<OkPacket>(
      "SELECT * FROM verify WHERE email = ?",
      [email]
    );
    // checking that password reset request was issued
    if (Array.isArray(result[0]) && result[0].length === 0)
      return res.sendStatus(400);
    const verificationRequest: IVerifyDBRecord = result[0][0];
    // verifying token data
    if (verificationRequest.token !== token)
      return res.status(401).json({ message: "Incorrect verification data" });
    // checking that verification request is not outdated
    // compareTimestamps accepts MySQL timestamp string, MySQL Offset (Planetscale MySQL UTC-4), and max delta in seconds
    if (
      !compareTimestamps({
        mySQLTimestamp: verificationRequest.ts,
        mySQLOffset: -4,
        maxDelta: 10 * 60,
      })
    )
      return res.status(400).json({ message: "Verification link expired" });

    // assigning a random password and removing verification request data from the DB
    await pool.execute("DELETE FROM verify WHERE email = ?", [email]);

    const randomPassword = getRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await pool.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // finding user's preferred language
    const lang = getUserLanguage(
      await pool
        .execute("SELECT locale FROM users WHERE email = ?", [email])[0][0]
        .slice(0, 2)
    );

    // displaying new password page on reset
    res.render("password", {
      root: path.join(__dirname, "public", lang),
      password: randomPassword,
      email,
      dplink: process.env.ALLOWED_ORIGIN_PROD,
    });
    // return res.redirect(process.env.ALLOWED_ORIGIN_PROD);
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
};

export default { resetPassword };
