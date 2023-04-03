import { pool } from '../db/DBConnect.js';
import sendEmail from '../util/sendEmail.js';
import crypto from 'crypto';
const confirmUser = async (req, res) => {
    const sendMailOptions = req.body;
    const userEmailFromAccessToken = req.userEmail;
    // checking if email already confirmed
    try {
        const result = await pool.execute('SELECT email_confirmed FROM users WHERE email = ?', [userEmailFromAccessToken]);
        if (result[0][0].email_confirmed)
            return res.status(204).json({ message: 'Email already confirmed' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to check if email already verified' });
    }
    // generating confrim token
    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
    try {
        // writing verification data into DB with replace
        await pool.execute('REPLACE INTO verify (email, token) VALUES(?, ?)', [userEmailFromAccessToken, emailConfirmationToken]);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to replace verification data' });
    }
    // creating html verification link to send to user
    // TODO: Make a better html
    const htmlVerificationLink = `<a href='${process.env.BASE_URI}/verify/${userEmailFromAccessToken}/${emailConfirmationToken}' target='_blank'>Click to Verify</a>`;
    const result = await sendEmail({
        to: 'warlockja@gmail.com',
        subject: 'Daily Planner Email verification',
        html: htmlVerificationLink //sendMailOptions.html
    });
    const message = result.accepted?.length === 1 ? 'An email sent to your account please verify' : 'There was an error sending email';
    return res.status(200).json({ message: message });
};
const deleteUser = async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'email required' });
    const userEmail = req.userEmail;
    if (email !== userEmail)
        return res.sendStatus(403);
    // deleting user
    try {
        const result = await pool.execute('DELETE FROM users WHERE email = ?', [email]);
        // checking if users was deleted
        if (result[0].affectedRows === 1) {
            // deleting user's todos
            await pool.execute('DELETE FROM todos WHERE useremail = ?', [email]);
            return res.status(200).json({ message: `Deleted user: ${email}` });
        }
        else
            return res.sendStatus(204);
    }
    catch (error) {
        return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
    }
};
export default { deleteUser, confirmUser };
//# sourceMappingURL=userController.js.map