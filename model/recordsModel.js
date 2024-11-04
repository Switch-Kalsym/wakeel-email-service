const { query } = require("../util");

async function deleteRecord(identifier, isEmail, id) {
  const sql = `DELETE FROM records WHERE ${isEmail ? "email" : "msisdn"} = ? AND record_id = ?`;
  return query(sql, [identifier, id]);
}

async function getRecords(identifier, isEmail, month, year, pageNumber, recordsPerPage) {
  const offset = (pageNumber - 1) * recordsPerPage;
  const sql = `
    SELECT r.record_id, r.email, r.msisdn, r.type, r.note, r.amount, r.date, r.month, r.year , r.category_id, uc.category_name, uc.icon_id 
    FROM records r 
    JOIN user_categories uc ON r.category_id = uc.id
    WHERE ${isEmail ? "r.email" : "r.msisdn"} = ? 
      AND r.month = ? 
      AND r.year = ? 
    LIMIT ? OFFSET ?
  `;
  return query(sql, [identifier, month, year, recordsPerPage, offset]);
}

async function countRecords(identifier, isEmail, month, year) {
  const sql = `SELECT COUNT(*) as count FROM records WHERE ${isEmail ? "email" : "msisdn"} = ? AND month = ? AND year = ?`;
  const result = await query(sql, [identifier, month, year]);
  return result[0].count;
}

async function insertRecord(identifier, isEmail, type, note, categoryId, amount, date, month, year) {
  const sql = `INSERT INTO records (${isEmail ? "email" : "msisdn"}, type, note, category_id, amount, date, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  return query(sql, [identifier, type, note, categoryId, amount, date, month, year]);
}

async function getTotalAmount(identifier, isEmail, month, year, type) {
  const sql = `SELECT SUM(amount) as total FROM records WHERE ${isEmail ? "email" : "msisdn"} = ? AND month = ? AND year = ? AND type = ?`;
  const result = await query(sql, [identifier, month, year, type]);
  return result[0].total || 0;
}

async function updateRecord(identifier, isEmail, id, type, note, categoryId, amount) {
  const sql = `UPDATE records 
               SET type = ?, note = ?, category_id = ?, amount = ? 
               WHERE ${isEmail ? "email" : "msisdn"} = ? AND record_id = ?`;
  return query(sql, [type, note, categoryId, amount, identifier, id]);
}

module.exports = {
  deleteRecord,
  getRecords,
  countRecords,
  insertRecord,
  getTotalAmount,
  updateRecord,
};
