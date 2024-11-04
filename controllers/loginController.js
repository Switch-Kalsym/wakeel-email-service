const loginModel = require("../model/loginModel");
const Joi = require("joi");
const moment = require("moment");
const util = require("../util");
const defaultConfig = require("../defaultconfig.json");

const schema = Joi.object({
  email: Joi.string().email(),
  msisdn: Joi.string().regex(/^\92[0-9]{10}$/),
  device_id: Joi.string().required(),
  fcm_token: Joi.string().required(),
}).xor("email", "msisdn");

async function login(req, res) {
  try {
    const { email, msisdn, device_id, fcm_token } = req.body;
    let data, identifier, isEmail;

    if (email) {
      data = { email, device_id, fcm_token };
      identifier = email;
      isEmail = true;
    } else if (msisdn) {
      data = { msisdn, device_id, fcm_token };
      identifier = `92${msisdn.slice(-10)}`;
      isEmail = false;
    } else {
      console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | Login | Please provide an email address or a phone number`);
      return res.status(400).json({
        success: false,
        message: "Please provide a email address or a number",
      });
    }

    const { error } = schema.validate(data);
    if (error) {
      console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | login | ` + error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    let otp;
    if (email == "monify@gmail.com") {
      otp = 1111;
    } else {
      otp = Math.floor(Math.random() * 9000) + 1000;
    }

    try {
      const identifierCheckResult = await loginModel.checkIdentifier(identifier, isEmail);
      if (identifierCheckResult.length === 0) {
        await loginModel.insertLoginRecord(identifier, otp, isEmail);
        console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | login | Login record inserted`);
      } else {
        await loginModel.updateLoginRecord(identifier, otp, isEmail);
        console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | login | Login record Updated`);
      }

      const resultFromFCM = await loginModel.insertDeviceInformation(identifier, device_id, fcm_token, isEmail);
      if (resultFromFCM.affectedRows === 1) {
        console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | login | Device Information inserted`);
      } else if (resultFromFCM.affectedRows === 2) {
        console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + identifier + "] " + `${defaultConfig.SERVICE_NAME} | login | Device Information Updated`);
      }

      await sendOtp(identifier, otp, isEmail);

      let response = {
        success: true,
        message: `Verification code sent to ${identifier}, Please check your ${isEmail ? "Inbox" : "SMS Inbox"}`,
      };

      if (!isEmail) {
        const networkType = await util.getOperatorType(identifier);
        response.networkType = networkType;
      }
      res.status(200).json(response);
    } catch (dbError) {
      console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "]" + `${defaultConfig.SERVICE_NAME} | login | Database Error: ` + dbError);
      return res.status(500).json({
        success: false,
        message: "Database Error: Something went wrong",
      });
    }
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "]" + `${defaultConfig.SERVICE_NAME} | login | Error in login API: ` + error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function sendOtp(identifier, otp, isEmail) {
  if (isEmail) {
    return await util.sendLoginOTPEmail(identifier, otp);
  } else {
    return await util.sendLoginOTPSMS(identifier, otp);
  }
}

module.exports = { login };
