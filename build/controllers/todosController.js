import pool from '../db/DBConnect.js';
const getTodos = (req, res) => {
    pool.query('SELECT * FROM todos')
        .then((result) => {
        res.status(200).json(result.rows);
    })
        .catch((error) => console.error(error));
};
const addTodo = (req, res) => {
    const { userid, title, description, date_due, reminder, reminder_interval } = req.body;
    // data validation
    if (!userid || !title)
        res.status(400).send({ message: 'UserID and Title required' });
    // validating data, removing undefined optional fields from further processing
    // invalidating reminder and reminder_interval if no date_due is set
    const reminderPlaceholder = date_due ? reminder : undefined;
    const reminder_intervalPlaceholder = date_due ? reminder_interval : undefined;
    let validFields = {
        userid,
        title,
        description,
        date_due,
        reminder: reminderPlaceholder,
        reminder_interval: reminder_intervalPlaceholder,
        date_created: new Date
    };
    Object.keys(validFields).forEach(key => validFields[key] === undefined && delete validFields[key]);
    // forming SQL request from valid fields
    let queryStringFields = '';
    let queryStringIndexes = '';
    const queryArray = Object.entries(validFields).map((item, index) => {
        queryStringFields += queryStringFields !== '' ? `, ${item[0]}` : `${item[0]}`;
        queryStringIndexes += queryStringIndexes !== '' ? `, $${index + 1}` : `$${index + 1}`;
        return item[1];
    });
    // adding new todo to the DB
    // INSERT INTO table_name (field1, field2 ...) VALUES ($1, $2 ...) RETURNING *
    pool.query(`INSERT INTO todos (${queryStringFields}) VALUES (${queryStringIndexes}) RETURNING *`, queryArray)
        .then((result) => {
        res.status(201).send(`Added todo with ID: ${result.rows[0].id}`);
    })
        .catch((error) => console.error(error));
};
const updateTodo = (req, res) => {
    const { id, userid, title, completed, description, date_due, reminder, reminder_interval } = req.body;
    if (!id)
        return res.sendStatus(200);
    // validating data, removing undefined optional fields from further processing
    // invalidating reminder and reminder_interval if no date_due is set
    const reminderPlaceholder = date_due ? reminder : undefined;
    const reminder_intervalPlaceholder = date_due ? reminder_interval : undefined;
    let validFields = {
        id,
        userid,
        title,
        completed,
        description,
        date_due,
        reminder: reminderPlaceholder,
        reminder_interval: reminder_intervalPlaceholder
    };
    Object.keys(validFields).forEach(key => validFields[key] === undefined && delete validFields[key]);
    // checking if any valid field beyond id is present if not finishing processing as there's no data to update
    if (Object.keys(req.body).length === 1)
        return res.sendStatus(200);
    // forming SQL request from valid fields
    let queryString = '';
    let idIndex = 0;
    const queryArray = Object.entries(validFields).map((item, index) => {
        item[0] !== 'id'
            ? queryString += queryString !== '' ? `, ${item[0]} = $${index + 1}` : `${item[0]} = $${index + 1}`
            : idIndex = index + 1;
        return item[1];
    });
    // updating todo
    // UPDATE table_name SET field1 = $1, field2 = $2 ... WHERE id = $id_index
    pool.query(`UPDATE todos SET ${queryString} WHERE id = $${idIndex}`, queryArray)
        .then(res.status(200).send(`Modified todo with ID: ${id}`))
        .catch((error) => console.error(error));
};
const deleteTodo = (req, res) => {
    const { id } = req.body;
    pool.query('DELETE FROM todos WHERE id = $1', [id])
        .then(response => response.rowCount > 0 ? res.status(200).send(`Deleted todo with ID: ${id}`) : res.status(404).send(`Not found todo entry with ID: ${id}`))
        .catch((error) => console.error(error));
};
export default { getTodos, addTodo, updateTodo, deleteTodo };
//# sourceMappingURL=todosController.js.map