const { query } = require("../util");
const moment = require("moment");
const defaultConfig = require("../defaultconfig.json");

async function getProfile(identifier, isEmail) {
  const sql = `SELECT ${isEmail ? "name, profile_picture, email" : "name, profile_picture, msisdn"} 
               FROM user_profile WHERE ${isEmail ? "email" : "msisdn"} = ?`;

  try {
    const result = await query(sql, [identifier]);

    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (err) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get Profile | Error getting user profile: ${err}`);
    throw new Error("Database error");
  }
}

async function createProfile(identifier, isEmail, name, profilePicture) {
  const sql = `INSERT INTO user_profile (${isEmail ? "email" : "msisdn"}, name, profile_picture) VALUES (?, ?, ?)`;
  return query(sql, [identifier, name, profilePicture]);
}

async function deleteProfile(identifier, isEmail) {
  const sql = `UPDATE jwt_token SET status = -1 WHERE ${isEmail ? "email" : "msisdn"} = ?`;
  return query(sql, [identifier]);
}

async function updateUserProfile(identifier, isEmail, name, profilePicture) {
  const sql = isEmail ? `UPDATE user_profile SET name = ?, profile_picture = ? WHERE email = ?` : `UPDATE user_profile SET name = ?, profile_picture = ? WHERE msisdn = ?`;
  return query(sql, [name, profilePicture, identifier]);
}

module.exports = {
  getProfile,
  createProfile,
  deleteProfile,
  updateUserProfile,
};
