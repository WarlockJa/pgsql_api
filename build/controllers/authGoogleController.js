import { pool } from '../db/DBConnect.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
// POST request. Authentication via Google with following authorization/registration
const authGoogleUser = async (req, res) => {
    // validating request body
    // const validationResult = await schema.validate(req.body);
    // if(validationResult.error) return res.status(400).json(validationResult.error.details[0].message);
    const { access_token } = req.body;
    // assigning default value to darkmode if not present in the request body or not truthy
    const darkmode = req.body.darkmode ? true : false;
    // verifying user and fetching user data from Google api
    const userGoogleData = await verifyGoogleCredentials({ access_token });
    const { sub, given_name, name, family_name, picture, email, email_verified, locale } = userGoogleData;
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
            // creating IdToken based on data fetched from Google
            idToken = {
                name: given_name ? given_name : name,
                surname: family_name ? family_name : '',
                picture: picture,
                email: email,
                email_confirmed: email_verified,
                locale: locale,
                darkmode: darkmode,
                authislocal: false
            };
            // console.log(idToken)
            await pool.execute('INSERT INTO users (email, email_confirmed, name, surname, locale, password, refreshtoken, darkmode, authislocal) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)', [email, email_verified, idToken.name, idToken.surname, locale, hashedPassword, refreshToken, darkmode, 0]);
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
                darkmode: foundUser.darkmode,
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