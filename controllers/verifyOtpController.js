const jwt = require("jsonwebtoken");
const moment = require("moment");
const util = require("../util");
const verifyOtpModel = require("../model/verfyOtpModel");
const defaultConfig = require("../defaultconfig.json");
const categoryModel = require("../model/categoryModel");
const userProfileModal = require("../model/userProfileModal");

async function verifyOTP(req, res) {
  try {
    const { email, msisdn, otp } = req.body;
    const identifier = email || msisdn;
    const isEmail = !!email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, otp: ${otp}`);
    if (!email && !msisdn) {
      const response = {
        success: false,
        message: "Please provide an email address or a phone number",
      };

      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Please provide an email address or a phone number | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    if (!otp) {
      const response = {
        success: false,
        message: "Verification Failed, Please provide the OTP",
      };

      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Verification Failed, Please provide the OTP | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const otpFromDb = await verifyOtpModel.getOTPFromDB(identifier, isEmail);
    if (!otpFromDb) {
      const response = {
        success: false,
        token: null,
        message: "OTP verification failed. Access denied.",
        profileStatus: false,
        profileResult: null,
      };

      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Otp not found in database | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }

    if (otpFromDb != otp) {
      const response = {
        success: false,
        token: null,
        message: "OTP verification failed. Access denied.",
        profileStatus: false,
        profileResult: null,
      };

      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Stored and the provided Otp's doesnot match | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(401).json(response);
    }

    await verifyOtpModel.updateOTPStatus(identifier, isEmail);

    const token = generateJWTToken(identifier);
    await verifyOtpModel.handleTokenInDB(identifier, token, isEmail);

    let profileResult = await userProfileModal.getProfile(identifier, isEmail);

    if (!profileResult) {
      profileResult = await util.getDefaultProfile(identifier, isEmail);
      await userProfileModal.createProfile(identifier, isEmail, profileResult.name, profileResult.profile_picture);

      const defaultCategories = await categoryModel.getDefaultCategories();
      for (const category of defaultCategories) {
        const { category_name, type, icon_id, group, hidden } = category;
        try {
          await categoryModel.insertUserCategory(category_name, type, icon_id, identifier, isEmail, group, hidden);
        } catch (error) {
          throw new Error(`Failed to insert category: ${category_name}`);
        }
      }
    }

    const response = {
      success: true,
      token,
      message: "OTP verification successful. Access granted.",
      profileStatus: !!profileResult,
      profileResult,
    };
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | verifyOtp | OTP verification successful. Access granted | Response : ${JSON.stringify(response, null, 2)}`);
    res.status(200).json(response);
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | verifyOtp | Error in verifyOTP API: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

function generateJWTToken(identifier) {
  const payload = { identifier };
  return jwt.sign(payload, defaultConfig.JWT_SECRET);
}

module.exports = { verifyOTP };
