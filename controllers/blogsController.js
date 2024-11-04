const Joi = require("joi");
const defaultConfig = require("../defaultconfig.json");
const moment = require("moment");
const blogsModel = require("../model/blogsModel");

async function insertBlogs(req, res) {
  const identifier = req.email || req.msisdn;

  console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Blogs | Received request body: ${JSON.stringify(req.body, null, 2)}`);

  try {
    const schema = Joi.object({
      blogType: Joi.string().required(),
      blog_link: Joi.optional(),
      title: Joi.string().required(),
      subtitle: Joi.string().required(),
      category: Joi.string().required(),
      sub_category: Joi.optional(),
      thumbUrl: Joi.string().required(),
    });

    const data = {
      blogType: req.body.blogType,
      blog_link: req.body.blog_link,
      title: req.body.title,
      subtitle: req.body.subtitle,
      category: req.body.category,
      sub_category: req.body.sub_category,
      thumbUrl: req.body.blogType === "1" ? `${defaultConfig.BLOG_IMAGES_LOCATION}${req.files[0].filename}` : req.body.blogType === "2" ? `${defaultConfig.BLOG_VIDEO_LOCATION}${req.files[0].filename}` : null,
    };

    const { error } = schema.validate(data);
    if (error) {
      console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Blogs | Validation Error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const response = await blogsModel.insertBlog(data);
    if (response.affectedRows > 0) {
      console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Blogs | Successfully inserted data into Blogs table`);
      return res.status(201).json({
        success: true,
        message: "Blog Inserted Successfully",
        insertedData: data,
      });
    } else {
      console.error(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Insert Blogs | Error inserting data`);
      return res.status(500).json({
        success: false,
        message: "Error occurred while inserting data",
      });
    }
  } catch (error) {
    console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Insert Blogs | Error in Insert Blogs API: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function getBlogs(req, res) {
  const identifier = req.email || req.msisdn;

  console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Blogs | Received request to get blogs`);

  try {
    const results = await blogsModel.getBlogs();

    if (results.length === 0) {
      console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Blogs | No blogs found`);
      return res.status(404).json({
        success: false,
        message: "No blogs found",
      });
    }

    const blog_data = results.map((row) => ({
      blogId: row.blog_id,
      blogType: row.blogType,
      blogLink: row.blog_link,
      title: row.title,
      subtitle: row.subtitle,
      category: row.category,
      sub_category: row.sub_category,
      thumbUrl: row.thumbUrl,
    }));

    console.log(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] [${identifier}] ${defaultConfig.SERVICE_NAME} | Get Blogs | Successfully fetched blogs`);
    return res.status(200).json({
      success: true,
      message: "Latest Blogs",
      blog_data,
    });
  } catch (error) {
    console.error(`[${moment().format("DD-MM-YYYY hh:mm:ssA")}] ${defaultConfig.SERVICE_NAME} | Get Blogs | Error in getBlogs: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Error occurred while fetching blogs",
    });
  }
}

module.exports = { insertBlogs, getBlogs };
