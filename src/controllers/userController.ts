import { OkPacket } from 'mysql2';
import { pool } from '../db/DBConnect.js';
import sendEmail from '../util/sendEmail.js';
import crypto from 'crypto';


// POST request. User email confirmation
const confirmUser = async (req, res) => {
    const userEmailFromAccessToken = req.userEmail;
    // checking if email already confirmed
    try {
        const result = await pool.execute<OkPacket>('SELECT email_confirmed FROM users WHERE email = ?', [userEmailFromAccessToken]);
        if(result[0][0].email_confirmed) return res.status(204).json({ message: 'Email already confirmed' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to check if email already verified' });
    }
    
    // generating confrim token
    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
    try {
        // writing verification data into DB with replace
        await pool.execute<OkPacket>('REPLACE INTO verify (email, token) VALUES(?, ?)', [userEmailFromAccessToken, emailConfirmationToken]);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to replace verification data' });
    }

    // creating html verification link to send user as email body
    const htmlVerificationLink =
    `<body style="padding: 3em; border-radius: 8px; background: linear-gradient(35deg, lightblue, rgb(232, 255, 254)); color: #131313; font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;">
        <h1>Daily Planner</h1>
        <p style="max-width: 700px; font-size: 1.5rem;">You received this e-mail as a part of verification process for <span style="color: #252525; font-weight: bold;">Daily Planner</span> website. Follow the link to confirm your e-mail address and unlock additional features, such as reminder option for your tasks!</p>
        <a style="color: #2626B6; font-size: 1.5rem;" onmouseleave="this.style.color='#2626B6'" onmouseover="this.style.color='#7626B6'" href='${process.env.BASE_URI}/verify/${userEmailFromAccessToken}/${emailConfirmationToken}' target='_blank'>Click to Verify</a>
    </body>`;

    const result = await sendEmail({
        to: 'warlockja@gmail.com',
        // to: userEmailFromAccessToken,
        subject: 'Daily Planner Email verification',
        html: htmlVerificationLink
    });
    const message = result.accepted?.length === 1 ? 'An email sent to your account please verify' : 'There was an error sending email';
    return res.status(200).json({ message: message });
}

// PUT request. Updates user data in the DB
const updateUser = (req, res) => {
    
}

// DELETE request. Deletes user and associated data from BD
const deleteUser = async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'email required' });
    const userEmail = req.userEmail;
    if(email !== userEmail) return res.sendStatus(403);

    // deleting user
    try {
        const result = await pool.execute<OkPacket>('DELETE FROM users WHERE email = ?',[email]);
        // checking if users was deleted
        if(result[0].affectedRows === 1) {
            // deleting user's todos
            await pool.execute<OkPacket>('DELETE FROM todos WHERE useremail = ?', [email]);
            return res.status(200).json({ message: `Deleted user: ${email}` });
        } else return res.sendStatus(204);
    } catch (error) {
        return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
    }
}

export default { deleteUser, confirmUser, updateUser }