import pg from 'pg';
const pool = new pg.Pool();
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
    const { id, userid, title, completed } = req.body;
    if (!id)
        return res.sendStatus(200);
    // const updateData = userid ? `userd = ${userid}` : 
    pool.query('UPDATE todos SET userid = $1, title = $2, completed = $3 WHERE id = $4', [userid, title, completed, id])
        .then((result) => {
        res.status(200).send(`Modified todo with ID: ${id}`);
    })
        .catch((error) => console.error(error));
};
const deleteTodo = (req, res) => {
    const { id } = req.body;
    pool.query('DELETE FROM todos WHERE id = $1', [id])
        .then((result) => {
        res.status(200).send(`Deleted todo with ID: ${id}`);
    })
        .catch((error) => console.error(error));
};
export default { getTodos, addTodo, updateTodo, deleteTodo };
//# sourceMappingURL=DBConnect.js.map