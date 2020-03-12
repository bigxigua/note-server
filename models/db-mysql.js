const mysql = require('mysql');
const {
    host,
    port,
    user,
    password,
    database,
    connectionLimit
} = require('../config/mysql-config');

// 忽略掉转义JSON字符串中的双引号，`${tableName}-${key}`;
const JSON_TYPE_COLLECTIONS = ['space-catalog'];

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
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    console.error('------->>>>>error', error);
                    reject(error);
                } else {
                    connection.query(sql, params, (err, res, fields) => {
                        connection.release();
                        console.log(sql);
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
        let sql = `DELETE FROM ${tableName} WHERE ${condition}`;
        console.log(sql);
        return this.execute(sql);
    }
    // 查
    find(tableName, where) {
        return this.execute(`SELECT * FROM ${tableName} WHERE ${where};`);
    }
    // 更新
    update(tableName, params, where) {
        const updateSql = Object.keys(params).reduce((p, v, i) => {
            let value = params[v];
            if (typeof value !== 'number') {
                value = value.toString();
                if (!JSON_TYPE_COLLECTIONS.includes(`${tableName}-${v}`)) {
                    // 非json类型先转义双引号为单引号，再整个加上双引号
                    value = value.replace(/"/mg, '\'');
                    value = `"${value}"`;
                } else {
                    // json类型，因key值必须由双引号包裹，不能转义
                    value = `'${value}'`;
                }
                value = value.replace(/\\/mg, '\\\\');
            }
            return p + `${v}=${value}${i === Object.keys(params).length - 1 ? '' : ','} `;
        }, '');
        return this.execute(`UPDATE ${tableName} SET ${updateSql} WHERE ${where}`);
    }
    // 改
    updateUserByAccount(tableName, value, account) {
        let values = [];
        const updateSql = value.keys().reduce((p, v) => {
            values.push(value[p]);
            return `${p} = ?, ` + `${v} = ? `;
        }, '');
        values.push(account);
        let sql = `update ${tableName} ${updateSql} WHERE account = ?`;
        return this.execute(sql, values);
    }
}
module.exports = new BaseMysql();