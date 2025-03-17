import { expenseSource } from "../constants/expense.js";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import fs from "fs";
import { promisify } from "util";
const unlinkAsync = promisify(fs.unlink);

const addExpense = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { amount, source, description } = req.body;

  const isValidSourceName = (name) => expenseSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid expense source", 400));
  }

  // check whether req.file contains the file
  // if not multer is failed to parse so notify the client
  if (!req.file) {
    res
      .status(413)
      .send(`File not uploaded!, Please attach jpeg file under 5 MB`);
    return;
  }

  const attachment = req.file.path;

  const query = `INSERT INTO expense (amount, source, attachment, description, user_id) VALUES ($1, $2, $3, $4, $5)`;

  await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, source, attachment, description, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  res.send({ success: true });
});

const updateExpense = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { expenseId, amount, source, description } = req.body;

  // Add validation for source, similar to addExpense
  const isValidSourceName = (name) => expenseSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid expense source", 400));
  }

  const query = `UPDATE expense SET amount = $1, source = $2, description = $3 WHERE expense_id = $4 AND user_id = $5`;

  const results = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, source, description, expenseId, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  // Check if any row was updated
  if (results.rowCount === 0) {
    return next(new ErrorHandler("Expense not found or not updated", 404));
  }

  res.send({ success: true, message: "Expense updated successfully" });
});

const deleteExpense = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { expenseId } = req.body;

  // First, fetch the attachment path
  const fetchQuery = `SELECT attachment FROM expense WHERE expense_id = $1 AND user_id = $2`;

  const attachmentResult = await new Promise((resolve, reject) => {
    connection.query(fetchQuery, [expenseId, user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  // If no expense found, return error
  if (attachmentResult.rowCount === 0) {
    return next(new ErrorHandler("Expense not found", 404));
  }

  // Get the attachment path
  const attachmentPath = attachmentResult[0].attachment;

  // Delete the expense from database
  const deleteQuery = `DELETE FROM expense WHERE expense_id = $1 AND user_id = $2`;

  const results = await new Promise((resolve, reject) => {
    connection.query(deleteQuery, [expenseId, user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Expense not deleted", 500));
  }

  // Delete the attachment file
  try {
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      await unlinkAsync(attachmentPath);
    }
  } catch (error) {
    console.error("Error deleting attachment:", error);
    // Optional: You might want to log this error but not stop the response
  }

  res.send("Expense Deleted Successfully");
});

const getExpense = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT SUM(amount) as expense FROM expense WHERE user_id = $1`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.send(results[0]);
});

// Additional helper function to get all expenses (optional)
const getAllExpenses = TryCatch(async (req, res) => {
  const user = req.user;

  const query = `SELECT * FROM expense WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.send({
    success: true,
    result,
  });
});

export { addExpense, updateExpense, deleteExpense, getExpense, getAllExpenses };
