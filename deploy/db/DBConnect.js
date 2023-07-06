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
export const ACCEPTED_LOCALES = ['en', 'ru', 'ru-RU', 'en-US', 'en-GB', 'en-ZW', 'en-AU', 'en-BZ', 'en-CA', 'en-IE', 'en-JM', 'en-NZ', 'en-PH', 'en-ZA', 'en-TT', 'en-VI'];
// export default {
//     query: (text: string, params?: any, callback?: (err: Error, result: pg.QueryResult<any>) => void) => {
//       return pool.query(text, params, callback)
//     }
// }
//# sourceMappingURL=DBConnect.js.map