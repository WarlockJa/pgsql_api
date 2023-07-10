import { pool } from "../db/DBConnect.js";
import crypto from "crypto";
import Joi from "joi";
import getEmailBody from "../util/getEmailBody.js";
import sendEmail from "../util/sendEmail.js";
const schemaResetPassword = Joi.object({
  email: Joi.string().email().required(),
});
// PUT request
const resetPassword = async (req, res) => {
  // Joi validation
  const validationResult = await schemaResetPassword.validate(req.body);
  if (validationResult.error)
    return res.status(400).json(validationResult.error.details[0].message);
  // valid fields
  const { email } = validationResult.value;
  try {
    // verifying that user in DB exists and their authentication type is local
    const result = await pool.execute(
      "SELECT authislocal FROM users WHERE email = ?",
      [email]
    );
    if (Array.isArray(result[0]) && result[0].length === 0)
      return res.status(401).json({ message: "user_not_found" });
    const foundUserAuthType = result[0][0];
    // password should not be reset if user authenticated through external credentials (Google)
    if (foundUserAuthType.authislocal === 0)
      return res.status(401).json({
        message: "auth_incorrect",
      });
    // generating confrim token
    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
    try {
      // writing verification data into DB with replace
      await pool.execute("REPLACE INTO verify (email, token) VALUES(?, ?)", [
        email,
        emailConfirmationToken,
      ]);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to replace verification data" });
    }
    // creating html verification link to send user as email body
    const htmlPasswordResetLink = getEmailBody({
      h1: "Daily Planner",
      bodyText:
        'You have received this e-mail because someone, hopefully you, has requested a password reset for this e-mail on <span style="color: #252525; font-weight: bold;">Daily Planner</span> website. Follow the link to proceed with the password reset. If it wasn\' you it is safe to ignore this message.',
      href: `${process.env.BASE_URI}/reset/${email}/${emailConfirmationToken}`,
      aText: "Click to Reset Password",
    });
    // sending email
    const emailResult = await sendEmail({
      // TODO switch to actual email
      // to: "warlockja@gmail.com",
      to: email,
      subject: "Daily Planner password reset",
      html: htmlPasswordResetLink,
    });
    const message =
      emailResult.accepted?.length === 1
        ? "An email was sent to your account"
        : "There was an error sending email";
    return res.status(200).json({ message: message });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
};
export default { resetPassword };
//# sourceMappingURL=passwordController.js.map
