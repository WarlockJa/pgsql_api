import { pool } from "../db/DBConnect.js";
import compareTimestamps from "../util/compareTimestamps.js";
import Joi from "joi";
const schemaVerifyUser = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
});
const verifyUser = async (req, res) => {
    // Joi validation
    const validationResult = await schemaVerifyUser.validate(req.params);
    if (validationResult.error)
        return res.status(400).json(validationResult.error.details[0].message);
    // valid fields
    const { email, token } = validationResult.value;
    try {
        // getting email verification data stored in DB
        const result = await pool.execute("SELECT * FROM verify WHERE email = ?", [email]);
        // checking that verification request was issued
        if (Array.isArray(result[0]) && result[0].length === 0)
            return res.sendStatus(400);
        const verificationRequest = result[0][0];
        // verifying token data
        if (verificationRequest.token !== token)
            return res.status(401).json({ message: "Incorrect verification data" });
        // checking that verification request is not outdated
        // compareTimestamps accepts MySQL timestamp string, MySQL Offset (Planetscale MySQL UTC-4), and max delta in seconds
        if (!compareTimestamps({
            mySQLTimestamp: verificationRequest.ts,
            mySQLOffset: -4,
            maxDelta: 10 * 60,
        }))
            return res.status(400).json({ message: "Verification link has expired" });
        // applying verified status and removing verification request data from the DB
        await pool.execute("DELETE FROM verify WHERE email = ?", [email]);
        await pool.execute("UPDATE users SET email_confirmed = ? WHERE email = ?", [
            true,
            email,
        ]);
        // redirecting user to the website on successful email verification
        return res.redirect(process.env.ALLOWED_ORIGIN_PROD);
    }
    catch (error) {
        return res.status(500).json({ message: error.stack });
    }
};
export default { verifyUser };
//# sourceMappingURL=verifyEmailController.js.map