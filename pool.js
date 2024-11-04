const mysql = require("mysql2")

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'RutPaswor321',
  database: 'todolist_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = pool.promise()