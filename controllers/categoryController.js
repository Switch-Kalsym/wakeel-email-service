const moment = require("moment");
const defaultConfig = require("../defaultconfig.json");
const categoryModel = require("../model/categoryModel");

async function getCategories(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Categories | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}`);

    const userCategories = await categoryModel.getUserCategories(identifier, isEmail);

    const response = {
      success: true,
      message: "Categories fetched successfully",
      total: userCategories.length,
      categories: userCategories,
    };
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Categories | Categories fetched successfully | Response : ${JSON.stringify(response, null, 2)}`);

    return res.status(200).json(response);
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get Categories | Error in Get Categories API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function insertCategory(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { category_name, type, icon_id, group = "custom", hidden = false } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Category | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Category: ${category_name}, Type: ${type}, Icon Id: ${icon_id}, Group: ${group}, Hidden: ${hidden})`);

    if (!category_name || !type || !icon_id) {
      const response = {
        success: false,
        message: "Failed! Category Name, Type and Icon ID are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Category | Category Name, Type and Icon ID are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const existingCategory = await categoryModel.checkCategoryExists(category_name, type, identifier, isEmail);
    if (existingCategory) {
      const response = {
        success: false,
        message: `Category with name ${category_name} already exists for type ${type} and Group ${existingCategory.group}`,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Category | Category with name ${category_name} already exists for type ${type} and Group ${existingCategory.group} | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(409).json(response);
    }

    const result = await categoryModel.insertUserCategory(category_name, type, icon_id, identifier, isEmail, group, hidden);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Category inserted successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Category | Category inserted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Failed to insert category",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Category | Failed to insert category | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(500).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Insert Category | Error in Insert Category API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateCustomCategory(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { id, category_name, type, icon_id, hidden } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Category: ${category_name}, Type: ${type}, Icon Id: ${icon_id}, Hidden: ${hidden})`);

    if (!id || !category_name || !type || !icon_id) {
      const response = {
        success: false,
        message: "Failed! Id, Category Name, Type, and Icon ID are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Id, Category Name, Type, and Icon ID are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    if (typeof hidden !== "boolean") {
      const response = {
        success: false,
        message: "Hidden should be either true or false",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Id, Category Name, Type, and Icon ID are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    let result;

    if (hidden === true || hidden === false) {
      result = await categoryModel.updateDefaultCategoryHidden(id, hidden, identifier, isEmail);
    } else {
      const existingCategory = await categoryModel.getCategoryByIdAndGroup(id, identifier, isEmail);
      if (!existingCategory) {
        const response = {
          success: false,
          message: `Custom category with ID "${id}" not found`,
        };
        console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Custom category with ID ${id} not found | Response : ${JSON.stringify(response, null, 2)}`);
        return res.status(404).json(response);
      }

      result = await categoryModel.updateCustomCategory(id, category_name, type, icon_id, identifier, isEmail);
    }

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Updated successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Category updated successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Failed to update custom category",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Failed to update category | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(500).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Update Custom Category | Error in Update Custom Category API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const { id } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Category | Deleting category with ID: ${id}`);

    if (!id) {
      const response = {
        success: false,
        message: "Failed! Id is required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Category | Id is required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const result = await categoryModel.deleteCategoryById(id);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: result.message,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete Category | Category deleted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: result.message,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete Category | Category with ID ${id} not deleted | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.error(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete Category | Error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  getCategories,
  insertCategory,
  updateCustomCategory,
  deleteCategory,
};
