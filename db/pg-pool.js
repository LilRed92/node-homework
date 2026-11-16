const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// eslint-disable-next-line no-unused-vars
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;
