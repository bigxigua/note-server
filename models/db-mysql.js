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
    find(tableName, where) {
        // where like account='fuck222' and password='1111'
        return this.execute(`SELECT * FROM ${tableName} WHERE ${where};`);
    }
    update(tableName, params, where) {
        const updateSql = Object.keys(params).reduce((p, v, i) => {
            const value = typeof params[v] === 'number' ? params[v] : `'${params[v]}'`;
            return p + `${v}=${value}${i === Object.keys(params).length - 1 ? '' : ','} `;
        }, '');
        return this.execute(`update ${tableName} SET ${updateSql} WHERE ${where}`);
    }
    // 改
    updateUserByAccount(tableName, value, account) {
        // value = {
        //     account: '111',
        //     password: '22222'
        // }
        let values = [];
        // UPDATE ${tableName} SET account = ?, password = ? WHERE account = ?'
        const updateSql = value.keys().reduce((p, v) => {
            values.push(value[p]);
            return `${p} = ?, ` + `${v} = ? `;
        }, '');
        values.push(account);
        // values like ['a', 'b', 'c', account]
        let sql = `update ${tableName} ${updateSql} WHERE account = ?`;
        return this.execute(sql, values);
    }
}

module.exports = new BaseMysql();