const { query } = require("../util");
const moment = require("moment");
const defaultConfig = require("../defaultconfig.json");

async function handleTokenInDB(identifier, token, isEmail) {
  try {
    const selectSql = `SELECT token FROM jwt_token WHERE ${isEmail ? "email" : "msisdn"} = ?`;
    const result = await query(selectSql, [identifier]);

    if (result.length === 0) {
      const insertSql = `INSERT INTO jwt_token (${isEmail ? "email" : "msisdn"}, token, status,identifierColumn) VALUES (?, ?, '1',?)`;
      await query(insertSql, [identifier, token, `${isEmail ? "email" : "msisdn"}`]);
    } else {
      const updateSql = `UPDATE jwt_token SET token = ?, status = '1' WHERE ${isEmail ? "email" : "msisdn"} = ?`;
      await query(updateSql, [token, identifier]);
    }
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "]" + `${defaultConfig.SERVICE_NAME} | Handle Token in DataBase | Error in handling token in the database: ${error}`);
    throw new Error("Database error");
  }
}

async function updateOTPStatus(identifier, isEmail) {
  const sql = `UPDATE login SET otpstatus = 'verified' WHERE ${isEmail ? "email" : "msisdn"} = ?`;
  return query(sql, [identifier]);
}

async function getOTPFromDB(identifier, isEmail) {
  try {
    const sql = `SELECT otp FROM login WHERE ${isEmail ? "email" : "msisdn"} = ?`;
    const result = await query(sql, [identifier]);
    return result.length ? result[0].otp : null;
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "]" + `${defaultConfig.SERVICE_NAME} | Get Otp from DataBase | Error getting OTP from the database: ${error}`);
    throw new Error("Database error");
  }
}

module.exports = {
  handleTokenInDB,
  updateOTPStatus,
  getOTPFromDB,
};
