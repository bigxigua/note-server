const NODE_ENV = process.env.env;
module.exports = {
  host: NODE_ENV === 'production' ? '45.76.98.174' : '127.0.0.1',
  port: 3306,
  user: NODE_ENV === 'production' ? 'data' : 'root',
  password: NODE_ENV === 'production' ? 'shuai' : 'tbzshuai',
  database: 'note_db',
  connectionLimit: 10,
};