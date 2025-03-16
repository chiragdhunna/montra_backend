import mysql from "mysql2";

// Create a connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    return;
  }
});

connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``,
  (err) => {
    if (err) {
      return;
    }

    // Now connect to the specific database
    connection.changeUser({ database: process.env.DB_NAME }, (err) => {
      if (err) {
        console.error("Error switching to database:", err);
      } else {
        console.log(`Connected to '${process.env.DB_NAME}' database!`);
      }
    });
  }
);

export default connection;
