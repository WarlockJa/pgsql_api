import { pool } from "../db/DBConnect.js";
import compareTimestamps from "../util/compareTimestamps.js";
import Joi from "joi";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import getRandomPassword from "../util/getRandomPassword.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaResetPassword = Joi.object({
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
    const result = await pool.execute("SELECT * FROM verify WHERE email = ?", [
      email,
    ]);
    // checking that password reset request was issued
    if (Array.isArray(result[0]) && result[0].length === 0)
      return res.sendStatus(400);
    const verificationRequest = result[0][0];
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
    // // creating html verification link to send user as email body
    // const htmlPasswordResetLink = getEmailBody({
    //   h1: "Daily Planner",
    //   bodyText: `Your password for Daily Planner website has been reset. New password is: ${randomPassword}`,
    //   href: `${process.env.ALLOWED_ORIGIN_PROD}`,
    //   aText: "to Daily Planner",
    // });
    // // sending email
    // const emailResult = await sendEmail({
    //   // TODO switch to actual email
    //   to: "warlockja@gmail.com",
    //   // to: email,
    //   subject: "Daily Planner password reset",
    //   html: htmlPasswordResetLink,
    // });
    // const message =
    //   emailResult.accepted?.length === 1
    //     ? "An email was sent to your account"
    //     : "There was an error sending email";
    // return res.status(200).json({ message: message });
    // redirecting user to the website on successful email verification
    res.render("password", {
      root: path.join(__dirname, "public"),
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
//# sourceMappingURL=resetPasswordController.js.map
