import { pool, IUser } from '../db/DBConnect.js';
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
                        // email: foundUser.email,
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

export default { authUser }