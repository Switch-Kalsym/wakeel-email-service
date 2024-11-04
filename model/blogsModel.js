const { query } = require("../util");

async function insertBlog(data) {
  const sql = `INSERT INTO blogs (blogType, blog_link, title, subtitle, category, sub_category, thumbUrl)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  return query(sql, [data.blogType, data.blog_link, data.title, data.subtitle, data.category, data.sub_category, data.thumbUrl]);
}

async function getBlogs() {
  const sql = `SELECT blog_id, blog_link, title, subtitle, category, sub_category, thumbUrl, blogType FROM blogs`;
  return query(sql);
}

module.exports = { insertBlog, getBlogs };
