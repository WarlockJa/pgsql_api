import { IUser, pool } from '../db/DBConnect.js';
import { createBinaryUUID, fromBinaryUUID, toBinaryUUID } from "binary-uuid";
import Joi from 'joi';
import { OkPacket, RowDataPacket } from 'mysql2';
 
interface ITodoResult {
    rows: { id: number; }[];
}

const getTodos = async (req, res) => {
    // getting user email from decoded access token
    const userEmail = req.userEmail;
    try {
        const result = await pool.execute('SELECT * FROM todos WHERE useremail = ?', [userEmail]);
        // converting binary ID from MySQL into readable UUID
        const resultWithIDasUUID = Array.isArray(result[0]) ? result[0].map((todo) => ({ ...todo, id: fromBinaryUUID(todo.id) })) : result;
        return res.status(200).json(resultWithIDasUUID);
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }
}

// Joi schema for addTodo
const schemaAddTodo = Joi.object ({
    // user email
    useremail: Joi.string()
        .email()
        .required(),
    // todo title
    title: Joi.string()
        .min(1)
        .max(74)
        .required(),
    // todo description
    description: Joi.string()
        .min(0)
        .max(254),
    // todo reminder setting state
    reminder: Joi.number().valid(1, 0),
    // todo date of reminder
    date_due: Joi.date()
});

const addTodo = async (req, res) => {
    // Joi schema validation
    const validationResult = await schemaAddTodo.validate(req.body);
    if(validationResult.error) return res.status(400).json(validationResult.error.details[0].message);

    // validated data
    const { useremail, title, description, date_due, reminder } = validationResult.value;

    // forming SQL request from valid fields
    // creating UUID/binary buffer pair as DB accepts BINARY(16) as primary key
    const todoIDtoBIN = createBinaryUUID();
    const insertMySQLdependencyArray = [
        todoIDtoBIN.buffer,
        useremail,
        title,
        description,
        reminder,
        date_due ? date_due : null
    ];

    // writing to DB
    try {
        await pool.execute('INSERT INTO todos (id, useremail, title, description, reminder, date_due) VALUES(?,?,?,?,?,?)', insertMySQLdependencyArray);
        return res.status(201).send({ message: `Added todo with ID ${todoIDtoBIN.uuid}` })
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }
    // INSERT INTO table_name (field1, field2 ...) VALUES ($1, $2 ...)

    // Postgres syntax
    // // forming SQL request from valid fields
    // let queryStringFields = '';
    // let queryStringIndexes = '';
    // const queryArray = Object.entries(validFields).map((item, index) => {
    //     queryStringFields += queryStringFields !== '' ? `, ${item[0]}` : `${item[0]}`
    //     queryStringIndexes += queryStringIndexes !== '' ? `, $${index + 1}` : `$${index + 1}`
    //     return item[1];
    // });
    
    // // adding new todo to the DB
    // // INSERT INTO table_name (field1, field2 ...) VALUES ($1, $2 ...) RETURNING *
    // pool.query(`INSERT INTO todos (${queryStringFields}) VALUES (${queryStringIndexes}) RETURNING *`, queryArray, (err: Error, result: ITodoResult) => {
    //     if(err) {
    //         return res.status(500).json({ message: `Error executing query ${err.stack}` }); 
    //     }
    //     return res.status(201).send({ message: `Added todo with ID: ${result.rows[0].id}` })
    // })
}

interface IUpdateTodoRequestBody {
    id: string;                 // todo id in the DB
    useremail?: string;         // user id of the todo
    title?: string;             // todo title
    completed?: boolean;        // completion flag
    description?: string;       // description of the todo
    date_due?: Date;            // date when due for the todo
    reminder?: boolean;         // flag to send a reminder for the date due
    // reminder_interval?: number; // time interval before the reminder is sent (minutes?)
}

const updateTodo = async (req: { body: IUpdateTodoRequestBody }, res) => {
    const { id, useremail, title, completed, description, date_due, reminder } = req.body;
    if (!id) return res.status(400).send({ message: 'Todo ID required' });

    // validating data, removing undefined optional fields from further processing
    // invalidating reminder and reminder_interval if no date_due is set
    const date_duePlaceholder = reminder
        ? date_due ? date_due : undefined
        : undefined

    // removing undefined fields from processing
    let validFields = {
        useremail,
        title,
        completed,
        description,
        reminder,
        date_due: date_duePlaceholder,
        id: toBinaryUUID(id)
    };
    Object.keys(validFields).forEach(key => validFields[key] === undefined && delete validFields[key]);
    // if only id field valid no need to update
    if (Object.keys(validFields).length === 1) return res.sendStatus(200);

    // forming SQL request from valid fields
    let queryString = ''; // 'field1 = ?, field2 = ?, ... , fieldN = ?'
    const queryArray = Object.entries(validFields).map((item) => {
        if(item[0] !== 'id') queryString += queryString !== '' ? `, ${item[0]} = ?` : `${item[0]} = ?`
        return item[1];
    });

    // writing to DB
    try {
        await pool.execute(`UPDATE todos SET ${queryString} WHERE id=?`, queryArray);
        return res.status(201).send({ message: `Updated todo with ID ${id}` })
    } catch (error) {
        return res.status(500).json({ message: `Error executing query ${error.stack}` });
    }
    // UPDATE table_name SET field1 = ?, field2 = ? ... WHERE id = ?

    // Postgres logic
    // let validFields = {
    //     id,
    //     userid,
    //     title,
    //     completed,
    //     description,
    //     reminder,
    //     date_due: date_duePlaceholder,
    //     // reminder_interval: reminder_intervalPlaceholder
    // };
    // Object.keys(validFields).forEach(key => validFields[key] === undefined && delete validFields[key]);

    // // checking if any valid field beyond id is present if not finishing processing as there's no data to update
    // if (Object.keys(req.body).length === 1)
    //     return res.sendStatus(200);

    // // forming SQL request from valid fields
    // let queryString = '';
    // let idIndex = 0;
    // const queryArray = Object.entries(validFields).map((item, index) => {
    //     item[0] !== 'id'
    //         ? queryString += queryString !== '' ? `, ${item[0]} = $${index + 1}` : `${item[0]} = $${index + 1}`
    //         : idIndex = index + 1;
    //     return item[1];
    // });

    // // updating todo
    // // UPDATE table_name SET field1 = $1, field2 = $2 ... WHERE id = $id_index
    // pool.query(`UPDATE todos SET ${queryString} WHERE id = $${idIndex}`, queryArray, (err: Error) => {
    //     if(err) {
    //         return res.status(500).json({ message: `Error executing query ${err.stack}` }); 
    //     }
    //     return res.status(200).send({ message: `Modified todo with ID: ${id}` })
    // })
}

const deleteTodo = async (req, res) => {
    const { id } = req.body;
    if(!id) return res.status(400).json({ message: "ID required" });

    const binaryUUID = toBinaryUUID(id);

    try {
        const result = await pool.execute<OkPacket>('DELETE FROM todos WHERE id = ?', [binaryUUID]);
        return result[0].affectedRows > 0 ? res.status(200).send({ message: `Deleted todo with ID: ${id}` }) : res.status(404).send({ message: `Not found todo entry with ID: ${id}` })
    } catch (error) {
        res.status(500).json({ message: `Error executing query ${error.stack}` }); 
    }
}

export default { getTodos, addTodo, updateTodo, deleteTodo };