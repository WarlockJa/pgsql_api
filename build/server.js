import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import cookieParser from 'cookie-parser';
import credentials from './middleware/credentials.js';
import verifyJWT from './middleware/verifyJWT.js';
import todosRouter from './routes/todos.js';
import authRouter from './routes/auth.js';
import registerRouter from './routes/register.js';
import refreshRoute from './routes/refresh.js';
config();
const app = express();
const PORT = process.env.PORT || 5000;
// middleware
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// import mysql from 'mysql2';
// const connection = mysql.createConnection(process.env.DATABASE_URL)
// console.log('Connected to PlanetScale!')
// connection.end()
// routes
app.get('/', (req, res) => { res.send("API is running"); });
app.use('/register', registerRouter);
app.use('/auth', authRouter);
app.use('/refresh', refreshRoute);
app.use('/todos', todosRouter);
app.use(verifyJWT);
app.listen(PORT, () => console.log("Server is running on port ", PORT));
//# sourceMappingURL=server.js.map