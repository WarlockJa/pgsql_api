import { IDBUserIdToken, pool } from '../db/DBConnect.js';
import jwt from 'jsonwebtoken';
import { OkPacket } from 'mysql2';

// GET request. Renew refresh and access tokens
const refreshToken = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies.dailyplanner) return res.sendStatus(401);

    const refreshToken = cookies.dailyplanner;

    // checking if refresh token exists in DB
    const result = await pool.execute<OkPacket>('SELECT refreshtoken, email FROM users WHERE refreshtoken = ?', [refreshToken]);
    if(Array.isArray(result[0]) && result[0].length === 0) return res.sendStatus(403);
    const foundUser: IDBUserIdToken = result[0][0];

    // verifying refresh token and reissuing both access and refresh tokens
    jwt.verify(cookies.dailyplanner, process.env.REFRESH_TOKEN_SECRET, async (err, result) => {
        if(err) return res.status(403).json({ message: err.message });

        const accessToken = jwt.sign(
            { "email": foundUser.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '600s' }
        );
        const refreshToken = jwt.sign(
            { "email": foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30d' }
        );

        // saving refresh token in DB
        await pool.query('UPDATE users SET refreshtoken = ? WHERE email = ?', [refreshToken, foundUser.email]);

        // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
        res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); //Path: '/refresh', sameSite: 'None', secure: true, 
        // sending renewed access token and a new cookie with refresh token
        return res.status(200).json({ accessToken });
    });
}

export default { refreshToken }