const mysql = require('mysql');
const {
    host,
    port,
    user,
    password,
    database,
    connectionLimit
} = require('../config/mysql-config');

class BaseMysql {
    constructor() {
        this.pool = null;
        this.init();
    }
    init() {
        this.pool = mysql.createPool({
            host,
            port,
            user,
            password,
            database,
            connectionLimit
        });
    }
    execute(sql, params = {}) {
        console.log('----------------sql-----------------------', sql);
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    console.error('------->>>>>error', error);
                    reject(error);
                } else {
                    connection.query(sql, params, (err, res, fields) => {
                        connection.release();
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(res);
                    });
                }
            });
        });
    }
    // 创建新表
    createTable() { }
    // 增 value 对象
    insert(tableName, value) {
        let sql = `INSERT INTO ${tableName} SET ?`;
        return this.execute(sql, value);
    }
    // 删
    delete(tableName, condition) {
        let sql = `IDELETE FROM ${tableName} WHERE ${condition}`;
        return this.execute(sql);
    }
    // 查
    findOne(tableName, where) {
        // where like account='fuck222' and password='1111'
        return this.execute(`SELECT * FROM ${tableName} WHERE ${where};`);
    }
    updateUserById(tableName, value, id) {
        // value = {
        //     account: '111',
        //     password: '22222'
        // }
        let values = [];
        // UPDATE ${tableName} SET account = ?, password = ? WHERE id = ?'
        const updateSql = value.keys().reduce((p, v) => {
            values.push(value[p]);
            return `${p} = ?, ` + `${v} = ? `;
        }, '');
        values.push(id);
        // values like ['a', 'b', 'c', userId]
        let sql = `update ${tableName} ${updateSql} WHERE id = ?`;
        return this.execute(sql, values);
    }
}

module.exports = new BaseMysql();