import { OkPacket } from 'mysql2';
import { IUser, pool } from '../db/DBConnect.js';
import sendEmail from '../util/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { IIdToken } from './authController.js';
import Joi from 'joi';

// get id token
const getUser = async (req, res) => {
    // getting email form access token
    const userEmail = req.userEmail;
    try {
        // finding user data
        const result = await pool.execute<OkPacket>('SELECT * FROM users WHERE email = ?', [userEmail]);
        if(Array.isArray(result[0]) && result[0].length === 0) return res.status(404).json({ message: 'user not found' });
        
        // forming idToken and sending result
        const foundUser = result[0][0];
        const idToken: IIdToken = {
            name: foundUser.name,
            surname: foundUser.surname,
            picture: foundUser.picture,
            email: foundUser.email,
            email_confirmed: foundUser.email_confirmed,
            locale: foundUser.locale,
            preferredtheme: foundUser.preferredtheme,
            authislocal: foundUser.authislocal
        };
        return res.status(200).json({ idToken });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to access DB' });
    }
}

// PUT request. User email confirmation
const confirmUser = async (req, res) => {
    const userEmailFromAccessToken = req.userEmail;
    // checking if email already confirmed
    try {
        const result = await pool.execute<OkPacket>('SELECT email_confirmed FROM users WHERE email = ?', [userEmailFromAccessToken]);
        if(result[0][0].email_confirmed) return res.status(204).json({ message: 'Email already confirmed' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to check if email already verified' });
    }
    
    // generating confrim token
    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
    try {
        // writing verification data into DB with replace
        await pool.execute<OkPacket>('REPLACE INTO verify (email, token) VALUES(?, ?)', [userEmailFromAccessToken, emailConfirmationToken]);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to replace verification data' });
    }

    // creating html verification link to send user as email body
    const htmlVerificationLink =
    `<body style="padding: 3em; border-radius: 8px; background: linear-gradient(35deg, lightblue, rgb(232, 255, 254)); color: #131313; font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;">
        <h1>Daily Planner</h1>
        <p style="max-width: 700px; font-size: 1.5rem;">You received this e-mail as a part of verification process for <span style="color: #252525; font-weight: bold;">Daily Planner</span> website. Follow the link to confirm your e-mail address and unlock additional features, such as reminder option for your tasks!</p>
        <a style="color: #2626B6; font-size: 1.5rem;" onmouseleave="this.style.color='#2626B6'" onmouseover="this.style.color='#7626B6'" href='${process.env.BASE_URI}/verify/${userEmailFromAccessToken}/${emailConfirmationToken}' target='_blank'>Click to Verify</a>
    </body>`;

    const result = await sendEmail({
        to: 'warlockja@gmail.com',
        // to: userEmailFromAccessToken,
        subject: 'Daily Planner Email verification',
        html: htmlVerificationLink
    });
    const message = result.accepted?.length === 1 ? 'An email sent to your account please verify' : 'There was an error sending email';
    return res.status(200).json({ message: message });
}


// Joi schema for updateUser
const schemaUpdateUser = Joi.object ({
    // user name
    name: Joi.string()
        .min(1)
        .max(254),
    // user surname
    surname: Joi.string(),
    // new password is checked for complexity rules
    oldpassword: Joi.string(),
    newpassword: Joi.string().pattern(new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,60}$/)),
    // preferred theme s - system, d - dark, l - light
    preferredtheme: Joi.string().valid('s', 'd', 'l'),
    locale: Joi.string().valid('en-US'),
    picture: Joi.string()
}).and('oldpassword', 'newpassword'); // checking that if oldpassword present, new password must be present and vice versa

// POST request. Updates user data in the DB
const updateUser = async (req, res) => {
    // user email from access token
    const userEmail = req.userEmail;
    // Joi schema validation
    const validationResult = await schemaUpdateUser.validate(req.body);
    if(validationResult.error) return res.status(400).json(validationResult.error.details[0].message);

    // reading user data from DB
    let foundUser: IUser;
    try {
        const result = await pool.execute<OkPacket>('SELECT * FROM users WHERE email = ?', [userEmail]);
        if(Array.isArray(result[0]) && result[0].length !== 0) {
            foundUser = result[0][0];
        } else {
            return res.status(404).json({ message: 'User does not exist' });
        }
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }

    // variable that is to be used in forming SQL request
    let validFields = validationResult.value;
    // processing password change attempt
    if(validFields['newpassword']) {
        // checking if attempting to change password for externally authenticated user (Google authentication)
        if(foundUser.authislocal === 0) return res.status(401).json({ message: 'Not allowed to change password with external authentication' });
        // checking if password is correct
        const match = await bcrypt.compare(validFields['oldpassword'], foundUser.password);
        if(!match) return res.status(401).json({ message: 'Old password is incorrect'});
        // adding password with the value of encrypted newpassword in the validFields and removing fields oldpassword and newpassword
        const hashedPassword = await bcrypt.hash(validFields['newpassword'], 10);
        validFields.password = hashedPassword;
        delete validFields['newpassword'];
        delete validFields['oldpassword'];
    }

    // forming SQL request from valid fields
    let queryString = ''; // 'field1 = ?, field2 = ?, ... , fieldN = ?'
    const queryArray = Object.entries(validationResult.value).map((item) => {
        queryString += queryString !== '' ? `, ${item[0]} = ?` : `${item[0]} = ?`;
        return item[1];
    });

    // writing to DB
    try {
        await pool.execute(`UPDATE users SET ${queryString} WHERE email=?`, [...queryArray, userEmail]);
        return res.status(200).send({ message: `Updated user with email ${userEmail}` });
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }

    // const idToken: IIdToken = {
    //     name: foundUser.name,
    //     surname: foundUser.surname,
    //     picture: foundUser.picture,
    //     email: foundUser.email,
    //     locale: foundUser.locale,
    //     preferredtheme: foundUser.preferredtheme,
    // };
}

// DELETE request. Deletes user and associated data from BD
const deleteUser = async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'email required' });
    const userEmail = req.userEmail;
    if(email !== userEmail) return res.sendStatus(403);

    // deleting user
    try {
        const result = await pool.execute<OkPacket>('DELETE FROM users WHERE email = ?',[email]);
        // checking if users was deleted
        if(result[0].affectedRows === 1) {
            // deleting user's todos
            await pool.execute<OkPacket>('DELETE FROM todos WHERE useremail = ?', [email]);
            return res.status(200).json({ message: `Deleted user: ${email}` });
        } else return res.sendStatus(204);
    } catch (error) {
        return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
    }
}

export default { deleteUser, confirmUser, updateUser, getUser }