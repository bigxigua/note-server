const NODE_ENV = process.env.env;
module.exports = {
  host: NODE_ENV === 'development' ? '127.0.0.1' : '139.196.84.53',
  port: 3306,
  user: 'root',
  password: NODE_ENV === 'development' ? 'shuaitbz' : 'shuai', // tbzshuai
  database: 'note_db',
  connectionLimit: 10,
};