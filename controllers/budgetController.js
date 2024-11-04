const budgetModel = require("../model/budgetModel");
const moment = require("moment");
const Joi = require("joi");
const defaultConfig = require("../defaultconfig.json");

const schema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).max(2100).required(),
});

async function getBudget(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const month = req.query.month;
    const year = req.query.year;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Budget | Request by ${isEmail ? "email" : "msisdn"}: ${identifier}, month: ${month}, year: ${year}`);

    const { error } = schema.validate({ month, year });

    if (error) {
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Budget | ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    let budgets = await budgetModel.getBudgetByIdentifier(identifier, isEmail, month, year);

    budgets = budgets.map((budget) => {
      if (budget.isMonthly === 1) {
        const { category_name, icon_id, totalExpenses, ...rest } = budget;
        return rest;
      }
      return budget;
    });

    if (budgets.length > 0) {
      const response = {
        success: true,
        message: "Successfully fetched budgets",
        total: budgets.length,
        data: budgets,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Budget | Budgets successfully fetched | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "No budgets found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Budget | No Budget found against the provided month and year | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.error(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get Budget | Error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateBudget(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { id, amount, month, year } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Update Budget | Request by ${isEmail ? "email" : "msisdn"}: ${identifier}, id: ${id}, amount: ${amount}, month: ${month}, year: ${year}`);

    if (!id || !amount || !month || !year) {
      const response = {
        success: false,
        message: "Failed! Budget ID, amount, month, and year are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Budget | id, month, year, amount are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const budget = await budgetModel.getBudgetById(id);
    if (!budget) {
      const response = {
        success: false,
        message: "Budget not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Budget | Budget not found for the provided id : ${id} | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }

    const updatedBudget = await budgetModel.updateBudgetById(id, amount, month, year);

    if (updatedBudget) {
      const response = {
        success: true,
        message: "Budget updated successfully",
        data: updatedBudget,
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Budget | Budget updated successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Failed to update budget",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Budget | Failed to update budget | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Update Budget | Error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function addBudget(req, res) {
  try {
    const { month, year, amount, category_id = null, isMonthly = true } = req.body;
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Add Budget | Request: month: ${month}, year: ${year}, amount: ${amount}, identifier: ${identifier}, category_id: ${category_id}, isMonthly: ${isMonthly}`);

    if (!month || !year || !amount) {
      const response = {
        success: false,
        message: "Failed! Month, year, amount, email or msisdn are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Add Budget | month, year, amount, category_id, isMonthly are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    if (isMonthly) {
      const existingMonthlyBudget = await budgetModel.checkMonthlyBudget(identifier, isEmail, month, year);
      if (existingMonthlyBudget.length) {
        const response = {
          success: false,
          message: "Budget for this month and year already exists",
        };
        console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Add Budget | Budget for this month and year already exists | Response : ${JSON.stringify(response, null, 2)}`);
        return res.status(400).json(response);
      }
    } else {
      const existingCategoryBudget = await budgetModel.checkCategoryBudget(identifier, isEmail, category_id, month, year);
      if (existingCategoryBudget.length) {
        const response = {
          success: false,
          message: "Budget for this category already exists",
        };
        console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Add Budget | Budget for this category already exists | Response : ${JSON.stringify(response, null, 2)}`);
        return res.status(400).json(response);
      }
    }

    const newBudget = await budgetModel.addBudget({ month, year, amount, isEmail, identifier, category_id, isMonthly });

    const response = {
      success: true,
      message: "Budget added successfully",
      data: newBudget,
    };
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Add Budget | Budget added successfully | Response : ${JSON.stringify(response, null, 2)}`);
    return res.status(200).json(response);
  } catch (error) {
    console.error(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Add Budget | Error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function deleteBudget(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const { id } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Request to delete budget with ID: ${id}`);

    if (!id) {
      const response = {
        success: false,
        message: "Failed! Budget ID is required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Budget ID is required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const budget = await budgetModel.getBudgetById(id);
    if (!budget) {
      const response = {
        success: false,
        message: "Budget not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Budget not found for the provided id: ${id} | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }

    const result = await budgetModel.deleteBudget(id);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Budget deleted successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Budget deleted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Failed to delete budget",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Failed to delete budget | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete Budget | Error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  getBudget,
  updateBudget,
  addBudget,
  deleteBudget,
};
