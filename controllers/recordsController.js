const moment = require("moment");
const defaultConfig = require("../defaultconfig.json");
const recordsModel = require("../model/recordsModel");

async function deleteRecord(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { id } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Record | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Id: ${id}`);

    if (!id) {
      const response = {
        success: false,
        message: "Failed, Record Id is required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Record | Record Id is required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const result = await recordsModel.deleteRecord(identifier, isEmail, id);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Record deleted successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Record | Record deleted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Record based on provided ID not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Delete Record | Record based on provided ID not found | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Delete Record | Error in Delete Record API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getRecords(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const month = req.query.month;
    const year = req.query.year;
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const recordsPerPage = 4;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Records | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Month: ${month}, Year: ${year}, Page: ${pageNumber}`);

    if (!month || !year) {
      const response = {
        success: false,
        message: "Failed, Month and Year is required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Record | Month and Year is required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const records = await recordsModel.getRecords(identifier, isEmail, month, year, pageNumber, recordsPerPage);
    const totalRecords = await recordsModel.countRecords(identifier, isEmail, month, year);

    const totalexpense = await recordsModel.getTotalAmount(identifier, isEmail, month, year, "expense");
    const totalincome = await recordsModel.getTotalAmount(identifier, isEmail, month, year, "income");

    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const hasNext = pageNumber < totalPages;

    const response = {
      success: true,
      message: "Successfully fetched records",
      records,
      totalexpense,
      totalincome,
      hasNext,
      totalPages,
    };

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Records | Records fetched successfully | Response : ${JSON.stringify(response, null, 2)}`);
    return res.status(200).json(response);
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get Records | Error in Get Records API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function insertRecords(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { type, note, categoryId, amount, date } = req.body;

    const month = moment(date).month() + 1;
    const year = moment(date).year();

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Record | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Type: ${type}, Note: ${note}, Category Id: ${categoryId}, Amount: ${amount}, Date: ${date}`);

    if (!type || !note || !categoryId || !amount || !date) {
      const response = {
        success: false,
        message: "Failed! type, note, category Id, amount, date are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Record | type, note, category name, amount, date are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const result = await recordsModel.insertRecord(identifier, isEmail, type, note, categoryId, amount, date, month, year);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Record inserted successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Record | Record inserted successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Failed to insert record",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Record | Failed to insert record | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(500).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Insert Record | Error in Insert Record API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateRecord(req, res) {
  try {
    const identifier = req.email || req.msisdn;
    const isEmail = !!req.email;
    const { id, type, note, categoryId, amount } = req.body;

    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Record | Request Parameters are ${isEmail ? "email" : "msisdn"}: ${identifier}, Record ID: ${id}, Type: ${type}, Note: ${note}, CategoryId: ${categoryId}, Amount: ${amount}`);

    if (!type || !note || !categoryId || !amount || !id) {
      const response = {
        success: false,
        message: "Failed! Reccord Id, type, note, category name, amount are required",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Record | Record Id, type, note, category name, amount are required | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(400).json(response);
    }

    const result = await recordsModel.updateRecord(identifier, isEmail, id, type, note, categoryId, amount);

    if (result.affectedRows > 0) {
      const response = {
        success: true,
        message: "Record updated successfully",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Record | Record updated successfully | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(200).json(response);
    } else {
      const response = {
        success: false,
        message: "Record based on provided ID not found",
      };
      console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Update Record | Record based on provided ID not found | Response : ${JSON.stringify(response, null, 2)}`);
      return res.status(404).json(response);
    }
  } catch (error) {
    console.log(`[${moment(Date.now()).format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Update Record | Error in Update Record API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  deleteRecord,
  getRecords,
  insertRecords,
  updateRecord,
};
