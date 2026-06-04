// Enhanced configuration: supports environment-based MongoDB URIs for flexibility and security
const mongoProdURI =
  process.env.MONGO_PROD_URI || "mongodb://todo-database:27017/todoapp";

module.exports = {
  mongoProdURI,
};
