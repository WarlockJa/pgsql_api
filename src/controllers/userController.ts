import { OkPacket } from 'mysql2';
import { pool } from '../db/DBConnect.js'

const deleteUser = async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'email required' });
    const userEmail = req.userEmail;
    if(email !== userEmail) return res.sendStatus(403);

    // deleting user
    try {
        const result = await pool.execute<OkPacket>('DELETE FROM users WHERE email = ?',[email]);
        // TODO delete user's todos
        return result[0].affectedRows === 1 ? res.status(200).json({ message: `Deleted user: ${email}` }) : res.sendStatus(204);
    } catch (error) {
        return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
    }
}

export default { deleteUser }