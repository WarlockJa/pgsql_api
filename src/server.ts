import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import todosRouter from './routes/todos.js';
import authRouter from './routes/auth.js';
config();
const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors(corsOptions));
app.use(express.json());

// routes
app.get('/', (req, res) => { res.send("API is running") });
app.use('/todos', todosRouter);
app.use('/auth', authRouter);

app.listen(PORT, () => console.log("Server is running on port ", PORT));