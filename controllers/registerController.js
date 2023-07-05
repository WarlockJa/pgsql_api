import { ACCEPTED_LOCALES, pool } from "../db/DBConnect.js";
import bcrypt from "bcrypt";
import Joi from "joi";
const schemaRegisterUser = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(254).required(),
  password: Joi.string()
    .pattern(new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,60}$/))
    .required(),
  darkmode: Joi.boolean(),
  locale: Joi.string().valid(...ACCEPTED_LOCALES),
  widgets: Joi.array().items(Joi.string().min(1).max(100)).required(),
});
// POST request. Registering new user with email-password pair
const registerUser = async (req, res) => {
  // Joi schema validation
  const validationResult = await schemaRegisterUser.validate(req.body);
  if (validationResult.error)
    return res.status(400).json(validationResult.error.details[0].message);
  // assigning default value to darkmode field if not present in the body
  const darkmode = validationResult.value.darkmode ? 1 : 0;
  // assigning default value to locale field if not present in the body
  const locale = validationResult.value.locale
    ? validationResult.value.locale
    : "en-US";
  const { email, name, password, widgets } = validationResult.value;
  // check if user already exists
  try {
    const result = await pool.execute("SELECT email FROM users WHERE email=?", [
      email,
    ]);
    if (Array.isArray(result[0]) && result[0].length > 0)
      return res.sendStatus(409);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error executing query ${error.stack}` });
  }
  // adding new user
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      "INSERT INTO users (email, name, password, email_confirmed, darkmode, locale, widgets) VALUES(?, ?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, 0, darkmode, locale, widgets]
    );
    return res.status(201).json({ message: `Added user: ${name}` });
  } catch (error) {
    return res
      .sendStatus(500)
      .json({ message: `There was an error: ${error.message}` });
  }
};
// TODO: TESTING ONLY! DELETE AFTER
const getUsers = async (req, res) => {
  try {
    const result = await pool.execute("SELECT * FROM users");
    return res.status(200).json(result[0]);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error executing query ${error.stack}` });
  }
};
export default { registerUser, getUsers };
//# sourceMappingURL=registerController.js.map
