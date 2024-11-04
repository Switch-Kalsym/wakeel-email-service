const { query } = require("../util");

async function getBudgetByIdentifier(identifier, isEmail, month, year) {
  const sql = `
    SELECT 
      b.id, b.month, b.year, b.amount, 
      uc.category_name,
      uc.icon_id,
      b.isMonthly,
      IFNULL(expenses.totalExpenses, 0) AS totalExpenses
    FROM 
      budget b
    LEFT JOIN 
      user_categories uc ON b.category_id = uc.id
    LEFT JOIN (
      SELECT 
        category_id, 
        SUM(amount) AS totalExpenses
      FROM 
        records
      WHERE 
        type = 'expense'
      GROUP BY 
        category_id
    ) expenses ON b.category_id = expenses.category_id
    WHERE 
      ${isEmail ? "b.email = ?" : "b.msisdn = ?"}
      AND b.month = ?
      AND b.year = ?
  `;

  return query(sql, [identifier, month, year]);
}

async function getBudgetById(id) {
  const sql = `SELECT * FROM budget WHERE id = ?`;
  const result = await query(sql, [id]);
  return result.length ? result[0] : null;
}

async function updateBudgetById(id, amount, month, year) {
  const updateSql = `UPDATE budget SET amount = ?, month = ?, year = ? WHERE id = ?`;
  const updateResult = await query(updateSql, [amount, month, year, id]);

  if (updateResult.affectedRows === 0) {
    return null;
  }

  const selectSql = `SELECT * FROM budget WHERE id = ?`;
  const updatedBudget = await query(selectSql, [id]);
  return updatedBudget.length ? updatedBudget[0] : null;
}

async function addBudget({ month, year, amount, isEmail, identifier, category_id, isMonthly }) {
  const sql = `
    INSERT INTO budget (month, year, amount, ${isEmail ? "email" : "msisdn"}, category_id, isMonthly) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [month, year, amount, identifier, category_id, isMonthly]);

  if (result.affectedRows === 0) {
    throw new Error("Failed to add budget");
  }

  const insertedId = result.insertId;
  const selectSql = `SELECT * FROM budget WHERE id = ?`;
  const newBudget = await query(selectSql, [insertedId]);
  return newBudget.length ? newBudget[0] : null;
}

async function deleteBudget(id) {
  const sql = `DELETE FROM budget WHERE id = ?`;
  return query(sql, [id]);
}

async function checkMonthlyBudget(identifier, isEmail, month, year) {
  const sql = `
    SELECT 1 FROM budget 
    WHERE ${isEmail ? "email = ?" : "msisdn = ?"}
    AND month = ?
    AND year = ?
    AND isMonthly = true
  `;
  return query(sql, [identifier, month, year]);
}

async function checkCategoryBudget(identifier, isEmail, category_id, month, year) {
  const sql = `
    SELECT 1 FROM budget 
    WHERE ${isEmail ? "email = ?" : "msisdn = ?"}
    AND category_id = ?
    AND month = ?
    AND year = ?
    AND isMonthly = false
  `;
  return query(sql, [identifier, category_id, month, year]);
}

module.exports = {
  getBudgetByIdentifier,
  getBudgetById,
  updateBudgetById,
  addBudget,
  deleteBudget,
  checkMonthlyBudget,
  checkCategoryBudget,
};
