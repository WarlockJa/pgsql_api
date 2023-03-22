import { pool, IUser } from '../db/DBConnect.js';
import jwt from 'jsonwebtoken';

const refreshToken = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies.dailyplanner) return res.status(401);

    const refreshToken = cookies.dailyplanner;

    // checking if refresh token exists in DB
    const result = await pool.query('SELECT refreshtoken, email FROM users WHERE refreshtoken = $1', [refreshToken]) as unknown as { rows: IUser[], rowCount: number; };
    if(result.rowCount === 0) return res.sendStatus(403);
    const foundUser = result.rows[0];

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
        foundUser.refreshtoken = refreshToken;
        await pool.query('UPDATE users SET refreshtoken = $1 WHERE email = $2', [refreshToken, foundUser.email]);

        // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
        res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 }); //Path: '/refresh', sameSite: 'None', secure: true, 
        // sending renewed access token and a new cookie with refresh token
        return res.status(200).json({ accessToken });
    })
}

export default { refreshToken }