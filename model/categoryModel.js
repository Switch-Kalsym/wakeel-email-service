const { query } = require("../util");

async function getUserCategories(identifier, isEmail) {
  const sql = `SELECT * FROM user_categories WHERE ${isEmail ? "email" : "msisdn"} = ?`;
  return query(sql, [identifier]);
}

async function getDefaultCategories() {
  const sql = "SELECT * FROM default_categories";
  return query(sql);
}

async function checkCategoryExists(category_name, type, identifier, isEmail) {
  const sql = `SELECT * FROM user_categories WHERE ${isEmail ? "email" : "msisdn"} = ? AND category_name = ? AND type = ?`;
  const result = await query(sql, [identifier, category_name, type]);
  return result[0];
}

async function updateUserCategoryHiddenStatus(id, hidden) {
  const sql = "UPDATE user_categories SET hidden = ? WHERE id = ?";
  return query(sql, [hidden, id]);
}

async function insertUserCategory(category_name, type, icon_id, identifier, isEmail, group, hidden) {
  const sql = `INSERT INTO user_categories (${isEmail ? "email" : "msisdn"}, category_name, type, \`group\`, icon_id, hidden) VALUES (?, ?, ?, ?, ?, ?)`;
  return query(sql, [identifier, category_name, type, group, icon_id, hidden]);
}

async function getCategoryByIdAndGroup(id, identifier, isEmail) {
  const sql = `SELECT * FROM user_categories WHERE id = ? AND ${isEmail ? "email" : "msisdn"} = ? AND \`group\` = 'Custom'`;
  const result = await query(sql, [id, identifier]);
  return result[0];
}

async function updateCustomCategory(id, category_name, type, icon_id, identifier, isEmail) {
  const sql = `UPDATE user_categories SET category_name = ?, type = ?, icon_id = ? WHERE id = ? AND ${isEmail ? "email" : "msisdn"} = ? AND \`group\` = 'Custom'`;
  return query(sql, [category_name, type, icon_id, id, identifier]);
}

async function updateDefaultCategoryHidden(id, hidden, identifier, isEmail) {
  const sql = `
    UPDATE user_categories
    SET hidden = ?
    WHERE \`group\` = 'default'
      AND id = ?
      AND ${isEmail ? "email = ?" : "msisdn = ?"}
  `;
  return query(sql, [hidden, id, identifier]);
}

async function deleteCategoryById(categoryId) {
  try {
    const checkDefaultSql = `SELECT COUNT(*) AS count FROM user_categories WHERE id = ? AND \`group\` = 'default'`;
    const defaultResult = await query(checkDefaultSql, [categoryId]);

    if (defaultResult[0].count > 0) {
      return { affectedRows: 0, message: "Cannot delete default categories." };
    }

    const checkCategoryExistsSql = `SELECT COUNT(*) AS count FROM user_categories WHERE id = ?`;
    const categoryExistsResult = await query(checkCategoryExistsSql, [categoryId]);

    if (categoryExistsResult[0].count === 0) {
      return { affectedRows: 0, message: "Category not found." };
    }

    const checkBudgetSql = `SELECT COUNT(*) AS count FROM budget WHERE category_id = ?`;
    const budgetResult = await query(checkBudgetSql, [categoryId]);

    const checkRecordsSql = `SELECT COUNT(*) AS count FROM records WHERE category_id = ?`;
    const recordsResult = await query(checkRecordsSql, [categoryId]);

    if (budgetResult[0].count > 0 || recordsResult[0].count > 0) {
      return { affectedRows: 0, message: "Category exists in either budget or records table. Cannot delete." };
    }

    const deleteSql = `DELETE FROM user_categories WHERE id = ?`;
    const result = await query(deleteSql, [categoryId]);
    return { affectedRows: result.affectedRows, message: "Category deleted successfully." };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

module.exports = {
  getUserCategories,
  getDefaultCategories,
  checkCategoryExists,
  insertUserCategory,
  updateUserCategoryHiddenStatus,
  getCategoryByIdAndGroup,
  updateCustomCategory,
  deleteCategoryById,
  updateDefaultCategoryHidden,
};
