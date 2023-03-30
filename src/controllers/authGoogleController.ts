import { pool } from '../db/DBConnect.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface IAuthGoogle {
    access_token: string;
}

type AuthGoogleResponse = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
}

async function verifyGoogleCredentials({ access_token }: IAuthGoogle) {
    // google api uri
    const GOOGLE_URI = 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=';

    try {
        // Get the JSON with all the user info
        const result = await fetch(GOOGLE_URI.concat() + access_token).then(response => response.json());
        // This is a JSON object that contains all the user info
        return result;
    } catch (error) {
        return error;
    }
}

const authGoogleUser = async (req, res) => {
    const { access_token } = req.body;
    if(!access_token) return res.sendStatus(400);

    // verifying user and fetching user data from Google api
    const userGoogleData: AuthGoogleResponse = await verifyGoogleCredentials({ access_token });
    const { sub, given_name, family_name, picture, email, email_verified, locale } = userGoogleData;

    // if no user data sending error
    if(!email) return res.status(500).json({ message: userGoogleData });

    try {
        // check if user present in DB
        const result = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        // generating tokens
        const accessToken = jwt.sign(
            { "email": email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '600s' }
        );
        const refreshToken = jwt.sign(
            { "email": email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30d' }
        );
        if(Array.isArray(result[0]) && result[0].length === 0) {
            // user not found. registration
            const hashedPassword = await bcrypt.hash(sub, 10); // dummy password, to prevent unauthorized access
            await pool.execute('INSERT INTO users (email, email_confirmed, name, surname, locale, password, refreshtoken) VALUES(?, ?, ?, ?, ?, ?, ?)',[email, email_verified, given_name, family_name, locale, hashedPassword, refreshToken]);
        } else {
            // user found, updating user data and refresh token
            await pool.execute('UPDATE users SET email_confirmed = ?, name = ?, surname = ?, locale = ?, refreshtoken = ? WHERE email = ?', [email_verified, given_name, family_name, locale, refreshToken, email]);
        }
        // authorization
        res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        // WARNING: keep access token in memory only
        return res.status(200).json({ accessToken, idToken: {
                name: given_name,
                surname: family_name,
                picture: picture,
                email: email,
                email_confirmed: email_verified,
                locale: locale
            }
        });
    } catch (error) {
        return res.status(500).json({ message: `Cannot access DB ${error.stack}` });
    }
}

export default { authGoogleUser }