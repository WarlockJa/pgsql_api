import { pool } from '../db/DBConnect.js'
import bcrypt from 'bcrypt'
import { OkPacket } from 'mysql2';

interface IUser {
    email: string;
    name: string;
    password: string;
}

const registerUser = async (req: { body: IUser }, res) => {
    // TODO data validation against DB types

    const { email, name, password } = req.body;
    if(!email || !name || !password) return res.sendStatus(400);

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
        await pool.execute('INSERT INTO users (email, name, password, email_confirmed) VALUES(?, ?, ?, ?)',[email, name, hashedPassword, false]);
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