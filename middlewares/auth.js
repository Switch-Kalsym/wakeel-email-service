const moment = require("moment");
const jwt = require("jsonwebtoken");
const defaultConfig = require("../defaultconfig.json");
const { query } = require("../util");

const verifyToken = async (req, res, next) => {
  const token = req.headers.token;
  const logTime = moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA");

  if (!token) {
    console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Token not found`);
    return res.status(401).json({
      success: false,
      message: "Token not found",
    });
  }

  try {
    jwt.verify(token, defaultConfig.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Invalid token or session expired`);
        return res.status(401).json({
          success: false,
          message: "Session expired, please login again",
        });
      }

      const sql = `SELECT email, msisdn, status FROM jwt_token WHERE token = ?`;
      try {
        const result = await query(sql, [token]);

        if (result.length === 0) {
          console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Access denied: token not found in database`);
          return res.status(401).json({
            success: false,
            message: "Invalid token, please login again",
          });
        }

        const user = result[0];

        if (user.status === "-1") {
          console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | User is deleted`);
          return res.status(401).json({
            success: false,
            message: "Invalid token, please login again",
          });
        }

        if (!user.email && !user.msisdn) {
          console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Both email and msisdn are null`);
          return res.status(401).json({
            success: false,
            message: "Invalid token, please login again",
          });
        }

        if (user.email) {
          req.email = user.email;
          console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Email found in token: ${req.email}`);
        }

        if (user.msisdn) {
          req.msisdn = user.msisdn;
          console.log(`[${logTime}]  ${defaultConfig.SERVICE_NAME} | Verify Token | MSISDN found in token: ${req.msisdn}`);
        }

        console.log(`[${logTime}] [${req.email || req.msisdn}] ${defaultConfig.SERVICE_NAME} | Verify Token | Successfully Verified Token`);
        next();
      } catch (err) {
        console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Database error: ${err}`);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }
    });
  } catch (error) {
    console.log(`[${logTime}] ${defaultConfig.SERVICE_NAME} | Verify Token | Error verifying token: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  verifyToken,
};
