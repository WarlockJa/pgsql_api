import { Request, Response } from 'express';
import pool from '../db/DBConnect.js';

interface ITodoResult {
    rows: { id: number; }[];
}

const getTodos = (req, res: Response<{}, {}>) => {
    pool.query('SELECT * FROM todos')
    .then((result: ITodoResult) => {
        res.status(200).json(result.rows)
    })
    .catch((error: Error) => console.error(error))
}

interface IAddTodoRequestBody {
    userid: number;
    title: string;
}

const addTodo = (req: Request<{}, {}, IAddTodoRequestBody>, res: Response<{}, {}>) => {
    const { userid, title } = req.body;
    if(userid && title) {
        pool.query('INSERT INTO todos (userid, title) VALUES ($1, $2) RETURNING *', [userid, title])
        .then((result: ITodoResult) => {
            res.status(201).send(`Added todo with ID: ${result.rows[0].id}`)
        })
        .catch((error: Error) => console.error(error));
    } else { res.sendStatus(400) }
}

interface IUpdateTodoRequestBody {
    id: number;
    userid: number;
    title: string;
    completed: boolean;
}

const updateTodo = (req: Request<{}, {}, IUpdateTodoRequestBody>, res: Response<{}, {}>) => {
    const { id, userid, title, completed } = req.body;
    if (!id) return res.sendStatus(200);

    // validating data, ignoring all the fields unnecessary tot he request that may be present
    let validFields = { id, userid, title, completed };
    Object.keys(validFields).forEach(key => validFields[key] === undefined && delete validFields[key]);

    // checking if any valid field beyond id is present if not finishing processing as there's no data to update
    if (Object.keys(req.body).length === 1)
        return res.sendStatus(200);

    // forming SQL request for the complete/incomplete field set model
    let queryString = '';
    let idIndex = 0;
    const queryArray = Object.entries(validFields).map((item, index) => {
        item[0] !== 'id'
            ? queryString += queryString !== '' ? `, ${item[0]} = $${index + 1}` : `${item[0]} = $${index + 1}`
            : idIndex = index + 1;
        return item[1];
    });

    // updating todo
    pool.query(`UPDATE todos SET ${queryString} WHERE id = $${idIndex}`, queryArray)
    .then(res.status(200).send(`Modified todo with ID: ${id}`))
    .catch((error: Error) => console.error(error));
}

interface IDeleteTodorequestBody {
    id: number;
}

const deleteTodo = (req: Request<{}, {}, IDeleteTodorequestBody>, res: Response<{}, {}>) => {
    const { id } = req.body;
    pool.query('DELETE FROM todos WHERE id = $1', [id])
        .then(response => response.rowCount > 0 ? res.status(200).send(`Deleted todo with ID: ${id}`) : res.status(404).send(`Not found todo entry with ID: ${id}`))
        .catch((error: Error) => console.error(error));
}

export default { getTodos, addTodo, updateTodo, deleteTodo };