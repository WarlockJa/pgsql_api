import { pool } from '../db/DBConnect.js';
import { OAuth2Client } from "google-auth-library";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OkPacket } from 'mysql2';

interface IAuthGoogle {
    clientId: string;
    credential: string;
    select_by?: "btn";
    access_token?: string;
}

interface IAuth {
    email?: string;
    password?: string;
    clientId?: string;
    credential?: string;
    select_by?: "btn";
}

async function verifyGoogleCredentials({ access_token, clientId, credential }: IAuthGoogle) {
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
    } catch (error) {
        return error;
    }
}

const authUser = async (req: { body: IAuth }, res) => {
    const { email, password, clientId, credential } = req.body;

    // verifying data sent through google button
    if(clientId && credential) {
        const verifiedUserData = await verifyGoogleCredentials({ clientId, credential });
        return res.status(200).json({ content: verifiedUserData });
    }

    // authorization
    if(email && password) {
        try {
            const result = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            if(Array.isArray(result[0]) && result[0].length === 0) return res.status(401).json({ message: 'User not found' });
            const foundUser = result[0][0];// as unknown as IUser;
            
            const match = await bcrypt.compare(password, foundUser.password);
            if(match) {
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
                await pool.execute('UPDATE users SET refreshtoken = ? WHERE email = ?', [refreshToken, email]);
                // refresh token cookie send as httpOnly so it cannot be accessed by JS. Sent with every request
                res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 }); //Path: '/refresh', sameSite: 'None', secure: true, 

                // sending access token and id token on authorization success
                // WARNING: keep access token in memory only
                return res.status(200).json({ accessToken, idToken: {
                        name: foundUser.name,
                        surname: foundUser.surname,
                        picture: foundUser.picture,
                        email: foundUser.email,
                        email_confirmed: foundUser.email_confirmed,
                        locale: foundUser.locale
                    }
                });
            } else return res.status(401).json({ message: 'Password incorrect'});
        } catch (error) {
            return res.status(500).json({ message: `Cannot access DB ${error.stack}` });
        }
    }
    return res.status(400).json({ message: 'insufficient data' });
}

const reauthUser = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies.dailyplanner) return res.sendStatus(401);

    const refreshToken = cookies.dailyplanner;

    // checking if refresh token exists in DB
    const result = await pool.execute<OkPacket>('SELECT * FROM users WHERE refreshtoken = ?', [refreshToken]);
    if(Array.isArray(result[0]) && result[0].length === 0) return res.sendStatus(403);
    const foundUser = result[0][0];

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
        return res.status(200).json({ accessToken, idToken: {
                name: foundUser.name,
                surname: foundUser.surname,
                picture: foundUser.picture,
                email: foundUser.email,
                email_confirmed: foundUser.email_confirmed,
                locale: foundUser.locale
            }
        });
    });
}

// removing refreshToken from the DB on user logout
const logoutUser = async(req, res) => {
    const cookies = req.cookies;
    if(!cookies.dailyplanner) return res.sendStatus(204);

    const refreshToken = cookies.dailyplanner;

    // checking if refresh token exists in DB and removing it
    const result = await pool.execute<OkPacket>('UPDATE users SET refreshtoken = null WHERE refreshtoken = ?', [refreshToken]);
    // deleting client-side cookie
    res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 0 }); 
    return result[0].affectedRows === 0 ? res.sendStatus(204) : res.status(200).json({ message: 'Logout successful' });
}

export default { authUser, reauthUser, logoutUser }