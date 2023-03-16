import pool from '../db/DBConnect.js';
import { OAuth2Client } from "google-auth-library";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
async function verify({ clientId, credential }) {
    const client = new OAuth2Client(clientId);
    try {
        // Call the verifyIdToken to varify and decode it
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        // Get the JSON with all the user info
        const payload = ticket.getPayload();
        // This is a JSON object that contains all the user info
        return payload;
    }
    catch (error) {
        return error;
    }
}
const authUser = async (req, res) => {
    const { email, password, clientId, credential } = req.body;
    // verifying data sent through google button
    if (clientId && credential) {
        const verifiedUserData = await verify({ clientId, credential });
        return res.status(200).json({ content: verifiedUserData });
    }
    // authetication
    if (email && password) {
        // await pool.query('SELECT * FROM users WHERE email=$1', [email], (err, result) => {
        //     if(err) return res.status(500).json({ message: 'Cannot access DB' });
        //     if(result.rowCount === 0) return res.status(401).json({ message: 'User not found' });
        //     console.log(result.rows);
        //     return res.sendStatus(200);
        // });
        const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (result.rowCount === 0)
            return res.status(401).json({ message: 'User not found' });
        const foundUser = result.rows[0];
        const match = await bcrypt.compare(password, foundUser.password);
        if (match) {
            const accessToken = jwt.sign({ "email": foundUser.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '600s' });
            const refreshToken = jwt.sign({ "email": foundUser.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
            // saving refresh token in DB
            foundUser.refreshtoken = refreshToken;
            await pool.query('UPDATE users SET refreshtoken = $1 WHERE email = $2', [refreshToken, email]);
            // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
            res.cookie('dp', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 }); //Path: '/refresh', sameSite: 'None', secure: true, 
            // keep only in memory
            return res.status(200).json({ accessToken, idToken: {
                    name: foundUser.name,
                    surname: foundUser.surname,
                    picture: foundUser.picture,
                    email: foundUser.email,
                    email_confirmed: foundUser.email_confirmed,
                    locale: foundUser.locale
                }
            });
        }
        return res.status(401).json({ message: 'Password incorrect' });
    }
    return res.status(400).json({ message: 'insufficient data' });
};
export default { authUser };
//# sourceMappingURL=authController.js.map