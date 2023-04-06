import { pool } from '../db/DBConnect.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
async function verifyGoogleCredentials({ access_token }) {
    // google api uri
    const GOOGLE_URI = 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=';
    try {
        // Get the JSON with all the user info
        const result = await fetch(GOOGLE_URI.concat() + access_token).then(response => response.json());
        // This is a JSON object that contains all the user info
        return result;
    }
    catch (error) {
        return error;
    }
}
// joi schema for google authentication request body
const schema = Joi.object({
    access_token: Joi.string()
        .pattern(new RegExp(/^[a-zA-Z0-9\-_.]{20,250}$/))
        .required(),
    preferredtheme: Joi.string()
        .valid('s', 'd', 'l')
});
const isValidPreferredTheme = (preferredtheme) => {
    return (typeof preferredtheme === 'string' &&
        preferredtheme !== null &&
        preferredtheme === 's' || preferredtheme === 'd' || preferredtheme === 'l');
};
// POST request. Authentication via Google with following authorization/registration
const authGoogleUser = async (req, res) => {
    // validating request body
    // const validationResult = await schema.validate(req.body);
    // if(validationResult.error) return res.status(400).json(validationResult.error.details[0].message);
    const { access_token } = req.body;
    // assigning default value to preferredtheme if not present in the request body
    const preferredtheme = isValidPreferredTheme(req.body.preferredtheme) ? req.body.preferredtheme : 's';
    // verifying user and fetching user data from Google api
    const userGoogleData = await verifyGoogleCredentials({ access_token });
    const { sub, given_name, family_name, picture, email, email_verified, locale } = userGoogleData;
    // if no user data sending error
    if (!email)
        return res.status(500).json({ message: userGoogleData });
    try {
        // check if user present in DB
        const result = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        // generating tokens
        const accessToken = jwt.sign({ "email": email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '600s' });
        const refreshToken = jwt.sign({ "email": email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
        let idToken;
        if (Array.isArray(result[0]) && result[0].length === 0) {
            // user not found. registration
            const hashedPassword = await bcrypt.hash(sub, 10); // dummy password, to prevent unauthorized access
            await pool.execute('INSERT INTO users (email, email_confirmed, name, surname, locale, password, refreshtoken, preferredtheme, authislocal) VALUES(?, ?, ?, ?, ?, ?, ?, ?)', [email, email_verified, given_name, family_name, locale, hashedPassword, refreshToken, preferredtheme, false]);
            // creating IdToken based on data fetched from Google
            idToken = {
                name: given_name,
                surname: family_name,
                picture: picture,
                email: email,
                email_confirmed: email_verified ? 1 : 0,
                locale: locale,
                preferredtheme: preferredtheme,
                authislocal: 1
            };
        }
        else {
            // user found, updating refresh token
            await pool.execute('UPDATE users SET refreshtoken = ? WHERE email = ?', [refreshToken, email]);
            // creating IdToken from DB data
            const foundUser = result[0][0];
            idToken = {
                name: foundUser.name,
                surname: foundUser.surname,
                picture: foundUser.picture,
                email: foundUser.email,
                email_confirmed: foundUser.email_confirmed,
                locale: foundUser.locale,
                preferredtheme: foundUser.preferredtheme,
                authislocal: foundUser.authislocal
            };
        }
        // authorization
        res.cookie('dailyplanner', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        // WARNING: keep access token in memory only
        return res.status(200).json({ accessToken, idToken });
    }
    catch (error) {
        return res.status(500).json({ message: `Cannot access DB ${error.stack}` });
    }
};
export default { authGoogleUser };
//# sourceMappingURL=authGoogleController.js.map