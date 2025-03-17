import jwt from "jsonwebtoken";
import connection from "../database/db.js";
import { TryCatch } from "./error.js";
import { ErrorHandler } from "../utils/utility.js";

const authentication = TryCatch((req, res, next) => {
  const { token } = req.headers;

  // Check if token exists
  if (!token) {
    return next(new ErrorHandler("Please provide authentication token", 401));
  }

  // Decode token and check if valid
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.userId) {
    return next(new ErrorHandler("Invalid authentication token", 401));
  }

  // Use PostgreSQL-specific parameterized query with double quotes for "user" table
  const query = `SELECT * FROM users WHERE user_id = $1`;

  connection.query(query, [decoded.userId], (err, result) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(
        new ErrorHandler("Database error during authentication", 500)
      );
    }

    if (!result || result.length === 0) {
      return next(new ErrorHandler("User does not exist", 404));
    }

    req.user = result[0];
    next();
  });
});

export { authentication };
