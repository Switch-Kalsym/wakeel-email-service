const { query } = require("../util");

async function checkIdentifier(identifier, isEmail) {
  const sql = `SELECT ${isEmail ? "email" : "msisdn"} FROM login WHERE ${isEmail ? "email" : "msisdn"} = ?`;
  return query(sql, [identifier]);
}

async function insertDeviceInformation(identifier, device_id, fcm_token, isEmail) {
  const fcmSql = `INSERT INTO device_information (${isEmail ? "email" : "msisdn"}, device_id, fcm_token)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE fcm_token = ?`;
  return query(fcmSql, [identifier, device_id, fcm_token, fcm_token]);
}

async function insertLoginRecord(identifier, otp, isEmail) {
  const insertSql = `INSERT INTO login (${isEmail ? "email" : "msisdn"}, otp) VALUES (?, ?)`;
  return query(insertSql, [identifier, otp]);
}

async function updateLoginRecord(identifier, otp, isEmail) {
  const updateSql = `UPDATE login SET otp = ? WHERE ${isEmail ? "email" : "msisdn"} = ?`;
  return query(updateSql, [otp, identifier]);
}

module.exports = {
  checkIdentifier,
  insertDeviceInformation,
  insertLoginRecord,
  updateLoginRecord,
};
