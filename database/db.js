const mysql = require("mysql2");
const moment = require("moment");
const config = require("../defaultconfig.json");

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  waitForConnections: true,
});

(() => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] | ${config.SERVICE_NAME} | MySQL connection failed: ${err.message}`);
    } else {
      console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] | ${config.SERVICE_NAME} | Connected to MySQL database!`);
      connection.release();
    }
  });
})();

// Keep-alive function to prevent the connection from closing
const keepAliveQuery = () => {
  pool.query("SELECT 1", (err) => {
    if (err) {
      console.error(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] | ${config.SERVICE_NAME} | Keep-alive query failed: ${err.message}`);
    } else {
      console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] | ${config.SERVICE_NAME} | Keep-alive query executed successfully`);
    }
  });
};

// Set interval to run the keep-alive query every 5 hours
setInterval(keepAliveQuery, 5 * 3600000);

module.exports = pool;
