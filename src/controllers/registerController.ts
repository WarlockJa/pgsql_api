import { pool } from '../db/DBConnect.js'
import bcrypt from 'bcrypt'
import { OkPacket } from 'mysql2';
import Joi from 'joi';

const schema = Joi.object ({
    email: Joi.string()
        .email()
        .required(),
    name: Joi.string()
        .min(1)
        .max(254)
        .required(),
    password: Joi.string()
        .pattern(new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,60}$/))
        .required(),
    preferredtheme: Joi.string().valid('s', 'd', 'l'),
    locale: Joi.string().valid('en-US')
})

export type LiteralLocale = 'en-US';
export type LiteralPreferredtheme = 's' | 'd' | 'l';

interface IUser {
    email: string;
    name: string;
    password: string;
    preferredtheme?: LiteralPreferredtheme;
    locale?: LiteralLocale;
}

// POST request. Registering new user with email-password pair
const registerUser = async (req: { body: IUser }, res) => {
    // TODO data validation against DB types

    const { email, name, password } = req.body;
    if(!email || !name || !password) return res.sendStatus(400);

    // schema validation test
    const validationResult = await schema.validate(req.body);

    // Joi schema validation
    if(validationResult.error) return res.status(400).json(validationResult.error.details[0].message);
    // assigning default value to preferredtheme field if not present in the body
    const preferredtheme = req.body.preferredtheme ? req.body.preferredtheme : 's';
    // assigning default value to locale field if not present in the body
    const locale = req.body.locale ? req.body.locale : 'en-US';

    // check if user already exists
    try {
        const result = await pool.execute<OkPacket>('SELECT email FROM users WHERE email=?',[email]);
        if(Array.isArray(result[0]) && result[0].length > 0) return res.sendStatus(409);
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` }); 
    }

    // adding new user
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute('INSERT INTO users (email, name, password, email_confirmed, preferredtheme, locale) VALUES(?, ?, ?, ?, ?)',[email, name, hashedPassword, false, preferredtheme, locale]);
        return res.status(201).json({ message: `Added user: ${name}` });
    } catch (error) {
        return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
    }
}

// TODO: TESTING ONLY! DELETE AFTER
const getUsers = async (req, res) => {
    try {
        const result = await pool.execute('SELECT * FROM users');
        return res.status(200).json(result[0]);
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }
}

export default { registerUser, getUsers }