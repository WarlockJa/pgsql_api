import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import cookieParser from 'cookie-parser'
import credentials from './middleware/credentials.js';
import verifyJWT from './middleware/verifyJWT.js';
import todosRouter from './routes/todos.js';
import authRouter from './routes/auth.js';
import registerRouter from './routes/register.js';
import refreshRoute from './routes/refresh.js';
import userRouter from './routes/user.js';
config();
const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// routes
app.get('/', (req, res) => { res.send("API is running") });
app.use('/register', registerRouter);
app.use('/auth', authRouter);
app.use('/refresh', refreshRoute);
app.use(verifyJWT);
app.use('/todos', todosRouter);
app.use('/user', userRouter);

app.listen(PORT, () => console.log("Server is running on port ", PORT));