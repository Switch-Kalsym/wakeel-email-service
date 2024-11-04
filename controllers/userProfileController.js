const moment = require("moment");
const defaultConfig = require("../defaultconfig.json");
const Joi = require("joi");
const userProfileModal = require("../model/userProfileModal");

const schema = Joi.object({
  email: Joi.string().email(),
  msisdn: Joi.string().regex(/^\92[0-9]{10}$/),
  name: Joi.string().required(),
  profilePicture: Joi.string().required(),
}).xor("email", "msisdn");

async function deleteUserProfile(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete User Profile | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}`);
    const result = await userProfileModal.deleteProfile(identifier, isEmail);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "User profile deleted successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete User Profile | User profile deleted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "User profile not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete User Profile | User profile not found | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete User Profile | Error in Delete User Profile API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getUserProfile(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get User Profile | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}`);
    const profile = await userProfileModal.getProfile(identifier, isEmail);

    if (profile) {
      const response = {
        success: true,
        message: `User profile retrieved successfully`,
        profile,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get User Profile | User profile retrieved successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "User profile not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get User Profile | User profile not found | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get User Profile | Error in Get User Profile API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function createUserProfile(req, res) {
  try {
    const { email, msisdn, name, profilePicture } = req.body;
    const identifier = email || msisdn;
    const isEmail = !!email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Create User Profile | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, name: ${name}, Profile Picture: ${profilePicture}`);

    const { error } = schema.validate({ email, msisdn, name, profilePicture });
    if (error) {
      const response = {
        success: false,
        message: error.details[0].message,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Create User Profile | ${error.details[0].message} | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const existingProfile = await userProfileModal.getProfile(identifier, isEmail);
    if (existingProfile) {
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Create User Profile | User already exists | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    await userProfileModal.createProfile(identifier, isEmail, name, profilePicture);

    const response = {
      success: true,
      message: "User profile created successfully",
    };
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Create User Profile | User profile created successfully | Response : ${JSON.stringify(response, null, 2)}`);
    return res.status(201).json(response);
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Create User Profile | Error in Create User Profile API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateUserProfile(req, res) {
  try {
    const { name } = req.body;
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;

    if (!name) {
      const response = {
        success: false,
        message: "Failed, name is required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update User Profile | name is required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const existingProfile = await userProfileModal.getProfile(identifier, isEmail);
    if (!existingProfile) {
      const response = {
        success: false,
        message: "User profile not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update User Profile | User profile not found | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }

    let profilePicture = existingProfile.profile_picture;

    if (req.files.length !== 0) {
      profilePicture = `${defaultConfig.PROFILE_IMAGES_LOCATION}${req.files[0].filename}`;
    }

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update User Profile | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, name: ${name}, Profile Picture: ${profilePicture}`);
    await userProfileModal.updateUserProfile(identifier, isEmail, name, profilePicture);

    const response = {
      success: true,
      message: "User profile updated successfully",
    };
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update User Profile | User profile updated successfully | Response : ${JSON.stringify(response, null, 2)}`);
    return res.status(200).json(response);
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Update User Profile | Error in Update User Profile API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = { deleteUserProfile, getUserProfile, createUserProfile, updateUserProfile };
