import { ACCEPTED_LOCALES, pool } from "../db/DBConnect.js";
import sendEmail from "../util/sendEmail.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import Joi from "joi";
import getEmailBody from "../util/getEmailBody.js";
// GET userLogout
const logoutUser = async (req, res) => {
  const userEmail = req.userEmail;
  // checking if refresh token exists in DB and removing it
  try {
    const result = await pool.execute(
      "UPDATE users SET refreshtoken = null WHERE email = ?",
      [userEmail]
    );
    // deleting client-side cookie
    res.cookie("dailyplanner", "", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 0,
    });
    return result[0].affectedRows === 0
      ? res
          .status(204)
          .json({ message: "User already logged out", status: 204 })
      : res.status(200).json({ message: "Logout successful", status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.stack, status: 500 });
  }
};
// PUT request. User email confirmation
const confirmUser = async (req, res) => {
  const userEmailFromAccessToken = req.userEmail;
  // checking if email already confirmed
  try {
    const result = await pool.execute(
      "SELECT email_confirmed FROM users WHERE email = ?",
      [userEmailFromAccessToken]
    );
    if (result[0][0].email_confirmed)
      return res.status(204).json({ message: "Email already confirmed" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to check if email already verified" });
  }
  // generating confrim token
  const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
  try {
    // writing verification data into DB with replace
    await pool.execute("REPLACE INTO verify (email, token) VALUES(?, ?)", [
      userEmailFromAccessToken,
      emailConfirmationToken,
    ]);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to replace verification data" });
  }
  // creating html verification link to send user as email body
  const htmlVerificationLink = getEmailBody({
    h1: "Daily Planner",
    bodyText:
      'You have received this e-mail as a part of verification process for <span style="color: #252525; font-weight: bold;">Daily Planner</span> website. Follow the link to confirm your e-mail address and unlock additional features, such as reminder option for your tasks!',
    href: `${process.env.BASE_URI}/verify/${userEmailFromAccessToken}/${emailConfirmationToken}`,
    aText: "Click to Verify",
  });
  const result = await sendEmail({
    // TODO switch to actual email
    // to: "warlockja@gmail.com",
    to: userEmailFromAccessToken,
    subject: "Daily Planner Email verification",
    html: htmlVerificationLink,
  });
  const message =
    result.accepted?.length === 1
      ? "An email sent to your account please verify"
      : "There was an error sending email";
  return res.status(200).json({ message: message });
};
// Joi schema for updateUser
const schemaUpdateUser = Joi.object({
  // user name
  name: Joi.string().min(1).max(254),
  // user surname
  surname: Joi.string().min(0),
  // new password is checked for complexity rules
  oldpassword: Joi.string(),
  newpassword: Joi.string().pattern(
    new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,60}$/)
  ),
  darkmode: Joi.boolean(),
  locale: Joi.string().valid(...ACCEPTED_LOCALES),
  picture: Joi.string(),
  hidecompleted: Joi.boolean(),
  widgets: Joi.string(),
}).and("oldpassword", "newpassword"); // checking that if oldpassword present, new password must be present and vice versa
// POST request. Updates user data in the DB
const updateUser = async (req, res) => {
  // user email from access token
  const userEmail = req.userEmail;
  // Joi schema validation
  const validationResult = await schemaUpdateUser.validate(req.body);
  if (validationResult.error)
    return res.status(400).json(validationResult.error.details[0].message);
  // reading user data from DB
  let foundUser;
  try {
    // selecting password and authislocal fields from DB
    // DB password to authorize password change
    // authislocal to ensure that password changed for locally regiestered users only
    const result = await pool.execute(
      "SELECT authislocal, password FROM users WHERE email = ?",
      [userEmail]
    );
    if (Array.isArray(result[0]) && result[0].length !== 0) {
      foundUser = result[0][0];
    } else {
      return res.status(404).json({ message: "User does not exist" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error executing query ${error.stack}` });
  }
  // SQL request
  let validFields = validationResult.value;
  // processing password change attempt
  if (validFields["newpassword"]) {
    // checking if attempting to change password for externally authenticated user (Google authentication)
    if (foundUser.authislocal === 0)
      return res.status(401).json({
        message: "Not allowed to change password with external authentication",
      });
    // checking if password is correct
    const match = await bcrypt.compare(
      validFields["oldpassword"],
      foundUser.password
    );
    if (!match)
      return res.status(401).json({ message: "oldpassword_incorrect" });
    // adding password with the value of encrypted newpassword in the validFields and removing fields oldpassword and newpassword
    const hashedPassword = await bcrypt.hash(validFields["newpassword"], 10);
    validFields.password = hashedPassword;
    delete validFields["newpassword"];
    delete validFields["oldpassword"];
  }
  // forming SQL request from valid fields
  let queryString = ""; // 'field1 = ?, field2 = ?, ... , fieldN = ?'
  const queryArray = Object.entries(validFields).map((item) => {
    queryString += queryString !== "" ? `, ${item[0]} = ?` : `${item[0]} = ?`;
    return item[1];
  });
  // writing to DB
  try {
    await pool.execute(`UPDATE users SET ${queryString} WHERE email=?`, [
      ...queryArray,
      userEmail,
    ]);
    return res
      .status(200)
      .send({ message: `Updated user with email ${userEmail}`, status: 200 });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error executing query ${error.stack}` });
  }
};
// DELETE request. Deletes user and associated data from BD
const deleteUser = async (req, res) => {
  // user email from access token
  const email = req.userEmail;
  // deleting user
  try {
    const result = await pool.execute("DELETE FROM users WHERE email = ?", [
      email,
    ]);
    // checking if users was deleted
    if (result[0].affectedRows === 1) {
      // deleting user's todos
      await pool.execute("DELETE FROM todos WHERE useremail = ?", [email]);
      // removing refresh token from the user PC
      res.cookie("dailyplanner", "", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 0,
      });
      return res
        .status(200)
        .json({ message: `Deleted user: ${email}`, status: 200 });
    } else
      return res.status(204).json({ message: "User not found", status: 204 });
  } catch (error) {
    return res
      .sendStatus(500)
      .json({ message: `There was an error: ${error.message}`, status: 500 });
  }
};
export default { deleteUser, confirmUser, updateUser, logoutUser };
//# sourceMappingURL=userController.js.map
