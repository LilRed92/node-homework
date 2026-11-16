// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log(
      "The database connection was refused. Is your database service running?",
    );
  }
  const statusCode = err.statusCode || 500;
  res
    .status(statusCode)
    .json({ error: err.message || "Internal Server Error" });
};

module.exports = errorHandler;
