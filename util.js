const nodemailer = require("nodemailer");
const mypool = require("./database/db");
const config = require("./defaultconfig.json");
const multer = require("multer");
const moment = require("moment");
const path = require("path");
const axios = require("axios");
const defaultConfig = require("./defaultconfig.json");

async function query(sql, params) {
  return new Promise((resolve, reject) => {
    mypool.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function getDefaultProfile(identifier, isEmail) {
  return {
    [isEmail ? "email" : "msisdn"]: identifier,
    name: "User",
    profile_picture: "https://gravatar.com/avatar/273b9ae535de53399c86a9b83148a8ed?s=400&d=mp&r=x",
  };
}

async function sendLoginOTPEmail(email, otp) {
  // Create a nodemailer transporter using SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: "no-reply@switch.com.pk",
      pass: "FiTfL3X1997",
    },
  });
  // Define email options
  const mailOptions = {
    from: "no-reply@switch.com.pk",
    to: email,
    subject: "Login Verification Code",
    text: `Your verification code is: ${otp}`,
  };
  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + email + "] " + `${defaultConfig.SERVICE_NAME} | Send Login Otp Email | Verification code email sent to ${email}`);
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + email + "] " + `${defaultConfig.SERVICE_NAME} | Send Login Otp Email | Error sending verification code email: ${error}`);
    throw error;
  }
}

async function sendLoginOTPSMS(msisdn, otp) {
  msisdn = msisdn.slice(-10);
  const login_otp_message = `Dear Customer, your OTP for Monify is ${otp}`;
  const url = config.MEDIATION_URL + `/sendsms/${msisdn}/` + login_otp_message;

  try {
    const response = await axios.get(url);
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + msisdn + "] " + `${defaultConfig.SERVICE_NAME} | Send Login Otp SMS | Send Login SMS Response Status Code: ${response.status}`);
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + msisdn + "] " + `${defaultConfig.SERVICE_NAME} | Send Login Otp SMS | Error in Sending Login SMS: ${error.message}`);
    throw error;
  }
}

async function getOperatorType(msisdn) {
  msisdn = msisdn.slice(-10);
  const url = `${config.MEDIATION_URL}/getOperatorType/${msisdn}`;
  try {
    const response = await axios.get(url);
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + msisdn + "] " + `${defaultConfig.SERVICE_NAME} | Get Operator Type | Status Code: ${response.status} , Response Data:  ${JSON.stringify(response.data)}`);
    return response.data.oprtype;
  } catch (error) {
    console.log("[" + moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA") + "] [" + msisdn + "] " + `${defaultConfig.SERVICE_NAME} | Get Operator Type | Errorin Get Operator Type: ${error.message}`);
    return error.message;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const blogType = req.body.blogType;
    console.log(blogType);
    let destinationFolder;
    if (blogType == 1) {
      destinationFolder = "./usersdata/blog_images/";
    } else if (blogType == 2) {
      destinationFolder = "./usersdata/blog_videos/";
    } else {
      destinationFolder = "./usersdata/profile_images/";
    }
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const msisdn = req.msisdn;
    const email = req.email;
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const identifier = req.email ? email : msisdn;
    cb(null, `${identifier}_${timestamp}${fileExtension}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload_pic = multer({
  storage: storage,
  fileFilter: imageFilter,
});

const mediaRestriction = (req, res, next) => {
  upload_pic.array("mediaContent", 30)(req, res, function (err) {
    if (err) {
      return res.status(415).json({
        success: false,
        message: "Unsupported file type. Please upload an image.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Media content is required. Please upload a file.",
      });
    }

    next();
  });
};

module.exports = {
  query,
  sendLoginOTPSMS,
  sendLoginOTPEmail,
  getOperatorType,
  mediaRestriction,
  getDefaultProfile,
};
