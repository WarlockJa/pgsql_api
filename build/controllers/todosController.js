import pool from '../db/DBConnect.js';
const getTodos = (req, res) => {
    pool.query('SELECT * FROM todos')
        .then((result) => {
        res.status(200).json(result.rows);
    })
        .catch((error) => console.error(error));
};
const addTodo = (req, res) => {
    const { userid, title } = req.body;
    pool.query('INSERT INTO todos (userid, title) VALUES ($1, $2) RETURNING *', [userid, title])
        .then((result) => {
        res.status(201).send(`Added todo with ID: ${result.rows[0].id}`);
    })
        .catch((error) => console.error(error));
};
const updateTodo = (req, res) => {
    const { id } = req.body;
    if (!id)
        return res.sendStatus(200);
    // checking if any field beyond id present
    if (Object.keys(req.body).length === 1)
        return res.sendStatus(200);
    let queryString = '';
    let idIndex = 0;
    const queryArray = Object.entries(req.body).map((item, index) => {
        item[0] !== 'id'
            ? queryString += queryString !== '' ? `, ${item[0]} = $${index + 1}` : `${item[0]} = $${index + 1}`
            : idIndex = index + 1;
        return item[1];
    });
    pool.query(`UPDATE todos SET ${queryString} WHERE id = $${idIndex}`, queryArray)
        .then(res.status(200).send(`Modified todo with ID: ${id}`))
        .catch((error) => console.error(error));
};
const deleteTodo = (req, res) => {
    const { id } = req.body;
    pool.query('DELETE FROM todos WHERE id = $1', [id])
        .then(res.status(200).send(`Deleted todo with ID: ${id}`))
        .catch((error) => console.error(error));
};
export default { getTodos, addTodo, updateTodo, deleteTodo };
//# sourceMappingURL=todosController.js.map