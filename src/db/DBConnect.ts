// import pg from 'pg';
// const pool = new pg.Pool();
import { config } from "dotenv";
import mysql from "mysql2/promise";
config();

export const pool = mysql.createPool({
  host: process.env.MSQL_HOST,
  user: process.env.MSQL_USER,
  database: process.env.MSQL_DB,
  password: process.env.MSQL_PSWD,
  ssl: {
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const ACCEPTED_LOCALES = [
  "en",
  "ru",
  "ru-RU",
  "en-US",
  "en-GB",
  "en-ZW",
  "en-AU",
  "en-BZ",
  "en-CA",
  "en-IE",
  "en-JM",
  "en-NZ",
  "en-PH",
  "en-ZA",
  "en-TT",
  "en-VI",
];
export type LiteralLocale =
  | "en"
  | "ru"
  | "ru-RU"
  | "en-US"
  | "en-GB"
  | "en-ZW"
  | "en-AU"
  | "en-BZ"
  | "en-CA"
  | "en-IE"
  | "en-JM"
  | "en-NZ"
  | "en-PH"
  | "en-ZA"
  | "en-TT"
  | "en-VI";

export interface IDBUserIdToken {
  name: string;
  surname: string;
  picture: string;
  email: string;
  email_confirmed: number;
  locale: string;
  refreshtoken: string;
  password: string;
  darkmode: number;
  authislocal: number;
  hidecompleted: number;
  widgets: string;
}

export interface IFrontEndUserIdToken {
  name: string;
  surname: string;
  picture: string | null;
  email: string;
  email_confirmed: boolean;
  locale: string;
  darkmode: boolean;
  authislocal: boolean;
  hidecompleted: boolean;
  widgets: string;
}

export interface IDBTodo {
  id: BinaryData;
  useremail: string;
  title: string;
  description: string;
  completed: number;
  reminder: number;
  date_due: Date;
  date_created: Date;
}

export interface IFrontEndTodo {
  id: string;
  useremail: string;
  title: string;
  description: string;
  completed: boolean;
  reminder: boolean;
  date_due: Date;
  date_created: Date;
}

// export default {
//     query: (text: string, params?: any, callback?: (err: Error, result: pg.QueryResult<any>) => void) => {
//       return pool.query(text, params, callback)
//     }
// }
