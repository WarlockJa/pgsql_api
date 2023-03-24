import { IUser, pool } from '../db/DBConnect.js';
import { OkPacket } from 'mysql2';

const getUserIdToken = async (req, res) => {
    const userEmail = req.userEmail;
    if(!userEmail) res.sendStatus(401);
    
    const result = await pool.execute<OkPacket>('SELECT * FROM users WHERE email = ?', [userEmail]);
    const foundUser: IUser = result[0][0];

    res.status(200).json({
        idToken: {
            name: foundUser.name,
            surname: foundUser.surname,
            picture: foundUser.picture,
            email: foundUser.email,
            email_confirmed: foundUser.email_confirmed,
            locale: foundUser.locale
        }
    })
}

export default { getUserIdToken }