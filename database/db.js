import pg from "pg";

// Create a connection pool
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres", // Connect to default DB initially
});

// Simple MySQL-like interface
const connection = {
  query: (text, params, callback) => {
    // Handle different parameter patterns to match MySQL's interface
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    return pool
      .query(text, params)
      .then((res) => {
        if (typeof callback === "function") {
          callback(null, res.rows, res.fields);
        }
        return res;
      })
      .catch((err) => {
        if (typeof callback === "function") {
          callback(err);
        }
        throw err;
      });
  },

  // Simple connect method that just runs the callback
  connect: (callback) => {
    if (typeof callback === "function") {
      // Just call the callback immediately
      callback();
    }
    return Promise.resolve();
  },

  // Emulated changeUser method
  changeUser: ({ database }, callback) => {
    console.log(`Connected to '${database}' database!`);
    if (callback) callback();
    return connection;
  },
};

// Create database if it doesn't exist
const setupDatabase = async () => {
  // Connect to default postgres database first
  const tempPool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });

  try {
    // Check if our target database exists
    const dbCheckResult = await tempPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    // Create the database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      await tempPool.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`Database '${process.env.DB_NAME}' created`);
    }

    // Call the emulated changeUser method
    connection.changeUser({ database: process.env.DB_NAME }, (err) => {
      if (err) {
        console.error("Error switching to database:", err);
      } else {
        console.log(`Connected to '${process.env.DB_NAME}' database!`);
      }
    });
  } catch (err) {
    console.error("Database setup error:", err);
  } finally {
    await tempPool.end();
  }
};

// Run the setup
setupDatabase();

export default connection;
