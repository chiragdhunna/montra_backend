import connection from "../database/db.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const signup = TryCatch((req, res, next) => {
  const { name, email, password, imgUrl, pin } = req.body;

  const query = `INSERT INTO user (name, email, password, img_url, pin) VALUES (?, ?, ?, ?, ?)`;

  connection.query(
    query,
    [name, email, password, imgUrl, pin],
    (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return next(new ErrorHandler("Database error", 500));
      } else {
        const emailQuery = "SELECT * FROM user WHERE email = ?";
        connection.query(emailQuery, [email], (err, result) => {
          if (err) {
            return next(new ErrorHandler("Database error", 500));
          }

          const user = result[0];
          const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            process.env.JWT_SECRET
          );
          res
            .status(201)
            .json({ success: true, userId: result.insertId, token });
        });
      }
    }
  );
});

const login = TryCatch((req, res, next) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM user WHERE email = ?";

  connection.query(query, [email], (err, results) => {
    if (err) return new ErrorHandler("Database error", 500);

    if (results.length === 0)
      return next(new ErrorHandler("Invalid credentials", 401));

    const user = results[0];

    // ✅ Generate JWT
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET
    );

    res.json({ success: true, token });
  });
});

const imageUpload = TryCatch((req, res, next) => {});

const logout = TryCatch((req, res, next) => {});

const exportData = TryCatch((req, res, next) => {
  // Format of the Report
  // 1. PDF
  // 2. CSV
  // Data to Export :
  // 1. All
  // 2. Expense Report
  // 3. Income Report
  // 4. Transfer Report
  // Date Range
  // 1. 30 days
  // 2. 3 Months
  // 3. 6 Months
  // 4. Last Year
});

export { signup, login, imageUpload, logout, exportData };
