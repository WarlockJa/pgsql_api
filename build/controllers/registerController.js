import pool from '../db/DBConnect.js';
import bcrypt from 'bcrypt';
const registerUser = async (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password)
        return res.sendStatus(400);
    const duplicate = await pool.query('SELECT email FROM users WHERE email=$1', [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: `Error executing query ${err.stack}` });
        }
        if (result.rowCount > 0) {
            res.sendStatus(409);
        }
        else {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query('INSERT INTO users (email, name, password, email_confirmed) VALUES($1, $2, $3, $4) RETURNING *', [email, name, hashedPassword, false], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: `Error executing query ${err.stack}` });
                    }
                    return res.status(201).json({ message: `Added user: ${result.rows[0].name}` });
                });
            }
            catch (error) {
                return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
            }
        }
    });
};
export default { registerUser };
//# sourceMappingURL=registerController.js.map