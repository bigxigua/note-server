const NODE_ENV = process.env.env;
module.exports = {
  host: NODE_ENV === 'production' ? '139.196.84.53' : '127.0.0.1',
  port: 3306,
  user: NODE_ENV === 'production' ? 'data' : 'root',
  password: NODE_ENV === 'production' ? 'shuai' : 'shuaitbz', // tbzshuai
  database: 'note_db',
  connectionLimit: 10,
};