import pg from 'pg';
const pool = new pg.Pool();

export interface IUser {
  id: number;
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

export default {
    query: (text: string, params?: any, callback?: (err: Error, result: pg.QueryResult<any>) => void) => {
      return pool.query(text, params, callback)
    }
}