import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render PostgreSQL requires SSL
  },
});

// Custom wrapper to maintain MySQL-style API compatibility
const connection = {
  query: (text, params, callback) => {
    if (typeof params === "function") {
      // Adjust for optional params
      callback = params;
      params = [];
    }

    pool
      .query(text, params)
      .then((res) => callback(null, res.rows)) // Keep MySQL-like structure
      .catch((err) => callback(err, null));
  },

  // No explicit `connect()` needed, since `pg.Pool` manages connections automatically
};

export default connection;
