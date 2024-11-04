const express = require("express");
const Router = express.Router();
const utils = require("../util");
const auth = require("../middlewares/auth");
const loginController = require("../controllers/loginController.js");
const verifyOtpController = require("../controllers/verifyOtpController");
const userProfileController = require("../controllers/userProfileController");
const recordsController = require("../controllers/recordsController");
const categoryController = require("../controllers/categoryController.js");
const budgetController = require("../controllers/budgetController");
const blogController = require("../controllers/blogsController.js");

Router.post("/login", loginController.login);
Router.post("/verifyOTP", verifyOtpController.verifyOTP);

/* prettier-ignore */
Router.route("/profile")
.post(auth.verifyToken,userProfileController.createUserProfile)
.delete(auth.verifyToken,userProfileController.deleteUserProfile)
.get(auth.verifyToken,userProfileController.getUserProfile)
.patch(auth.verifyToken,utils.mediaRestriction, userProfileController.updateUserProfile);

/* prettier-ignore */
Router.route("/record")
  .post(auth.verifyToken, recordsController.insertRecords)
  .delete(auth.verifyToken, recordsController.deleteRecord)
  .get(auth.verifyToken, recordsController.getRecords)
  .patch(auth.verifyToken, recordsController.updateRecord);

/* prettier-ignore */
Router.route("/category")
  .post(auth.verifyToken, categoryController.insertCategory)
  .delete(auth.verifyToken, categoryController.deleteCategory)
  .get(auth.verifyToken, categoryController.getCategories)
  .patch(auth.verifyToken, categoryController.updateCustomCategory);

/* prettier-ignore */
Router.route("/budget") 
  .post(auth.verifyToken, budgetController.addBudget)
  .get(auth.verifyToken, budgetController.getBudget)
  .patch(auth.verifyToken, budgetController.updateBudget)
  .delete(auth.verifyToken,budgetController.deleteBudget);

/* prettier-ignore */
Router.route("/blog") 
  .post(auth.verifyToken,utils.mediaRestriction, blogController.insertBlogs)
  .get(auth.verifyToken, blogController.getBlogs);

module.exports = Router;
