import { pool } from '../db/DBConnect.js'
import bcrypt from 'bcrypt'

interface IUser {
    email: string;
    name: string;
    password: string;
}

const registerUser = async (req: { body: IUser }, res) => {
    // TODO data validation against DB types

    const { email, name, password } = req.body;
    if(!email || !name || !password) return res.sendStatus(400);

    // check if user already exist
    const duplicate = pool.execute('SELECT email FROM users WHERE email=?',[email], async (err, rows, fields) => {
        if(err) {
            return res.status(500).json({ message: `Error executing query ${err.stack}` }); 
        }
        if(Array.isArray(rows) && rows.length > 0) return res.sendStatus(409);

        // adding new user
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            pool.execute('INSERT INTO users (email, name, password, email_confirmed) VALUES(?, ?, ?, ?)',[email, name, hashedPassword, false], (err) => {
                if(err) {
                    return res.status(500).json({ message: `Error executing query ${err.stack}` }); 
                }
                return res.status(201).json({ message: `Added user: ${name}` });
            });
        } catch (error) {
            return res.sendStatus(500).json({ message: `There was an error: ${error.message}` });
        }
    });
}

// TODO: TESTING ONLY! DELETE AFTER
const getUsers = (req, res) => {
    pool.execute('SELECT * FROM users', (err: Error, result) => {
        if(err) {
            return res.status(500).json({ message: `Error executing query ${err.stack}` });
        }
        return res.status(200).json(result);
    })
}

export default { registerUser, getUsers }