import { OkPacket } from 'mysql2';
import { pool } from '../db/DBConnect.js'
import sendEmail, { INodemailerEmailOptions } from '../util/sendEmail.js';

const confirmEmail = async (req, res) => {
    const sendMailOptions: INodemailerEmailOptions = req.body;
    const result = await sendEmail({
        to: sendMailOptions.to,
        replyTo: sendMailOptions.replyTo,
        subject: sendMailOptions.subject,
        html: sendMailOptions.html
    });
    
    return res.status(200).json({ message: result });
}

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

export default { deleteUser, confirmEmail }