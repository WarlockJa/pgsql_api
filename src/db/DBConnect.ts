// import pg from 'pg';
// const pool = new pg.Pool();
import { config } from 'dotenv';
import mysql from 'mysql2/promise';
config();

export const pool = mysql.createPool({
  host: process.env.MSQL_HOST,
  user: process.env.MSQL_USER,
  database: process.env.MSQL_DB,
  password: process.env.MSQL_PSWD,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface IUser {
  id: string;
  clientId: string;
  name: string;
  surname: string;
  picture: string;
  email: string;
  email_confirmed: boolean;
  locale: string;
  refreshtoken: string;
  password: string;
}

// export default {
//     query: (text: string, params?: any, callback?: (err: Error, result: pg.QueryResult<any>) => void) => {
//       return pool.query(text, params, callback)
//     }
// }