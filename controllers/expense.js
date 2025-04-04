import { bankNames } from "../constants/bank.js";
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
  const bank_name = req.body.bank_name?.trim() || null;
  const wallet_name = req.body.wallet_name?.trim() || null;

  const getWalletsQuery = `select name from wallet where user_id = $1`;

  const wallets = await new Promise((resolve, reject) => {
    connection.query(getWalletsQuery, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (wallet_name != null && wallets.includes(wallet_name)) {
    return next(new ErrorHandler("Wallet Name not Found", 404));
  }

  const isValidSourceName = (name) => expenseSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid expense source", 400));
  }

  const isValidBankName = (name) => bankNames.includes(name);

  if (bank_name != null && !isValidBankName(bank_name)) {
    return next(new ErrorHandler("Invalid bank name", 400));
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

  if (bank_name != null) {
    const query = `INSERT INTO expense (amount, source, attachment, description, user_id, bank_name) VALUES ($1, $2, $3, $4, $5, $6)`;

    await new Promise((resolve, reject) => {
      connection.query(
        query,
        [amount, source, attachment, description, user.user_id, bank_name],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  } else if (wallet_name != null) {
    const query = `INSERT INTO expense (amount, source, attachment, description, user_id, wallet_name) VALUES ($1, $2, $3, $4, $5, $6)`;

    await new Promise((resolve, reject) => {
      connection.query(
        query,
        [amount, source, attachment, description, user.user_id, wallet_name],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  } else {
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
  }

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

  res.json({ expense: results[0].expense ? parseInt(results[0].expense) : 0 });
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

  res.json({
    expenses: result,
  });
});

// Getting Expense stats for the graph by today, this week, this month, and this year
const getExpenseStats = TryCatch(async (req, res, next) => {
  const user = req.user;

  // 🟢 1. Summary Stats
  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN created_at::date = CURRENT_DATE THEN amount ELSE 0 END) as today,
      SUM(CASE WHEN extract(week from created_at) = extract(week from current_date) THEN amount ELSE 0 END) as week,
      SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) THEN amount ELSE 0 END) as month,
      SUM(CASE WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END) as year
    FROM expense
    WHERE user_id = $1
  `;

  const summary = await new Promise((resolve, reject) => {
    connection.query(summaryQuery, [user.user_id], (err, result) => {
      if (err) reject(err);
      else resolve(result[0]);
    });
  });

  // 🟢 2. Grouped Frequency Data
  const frequencyQuery = `
    SELECT 
      CASE 
        WHEN created_at::date = CURRENT_DATE THEN TO_CHAR(created_at, 'HH24:MI')
        WHEN created_at >= CURRENT_DATE - INTERVAL '6 days' THEN TO_CHAR(created_at, 'Day')
        WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) THEN TO_CHAR(created_at, 'DD')
        WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN TO_CHAR(created_at, 'MM')
      END AS label,
      CASE 
        WHEN created_at::date = CURRENT_DATE THEN 'today'
        WHEN created_at >= CURRENT_DATE - INTERVAL '6 days' THEN 'week'
        WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) THEN 'month'
        WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 'year'
      END AS period,
      SUM(amount) AS total
    FROM expense
    WHERE user_id = $1
      AND (
        created_at::date = CURRENT_DATE OR
        created_at >= CURRENT_DATE - INTERVAL '6 days' OR
        EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) OR
        EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      )
    GROUP BY period, label
    ORDER BY period, label;
  `;

  const frequencyRows = await new Promise((resolve, reject) => {
    connection.query(frequencyQuery, [user.user_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  // 🧠 Transform rows into grouped data
  const frequency = {
    today: [],
    week: [],
    month: [],
    year: [],
  };

  for (const row of frequencyRows) {
    const label = row.label?.trim?.();
    const total = parseFloat(row.total);
    frequency[row.period].push({ label, total });
  }

  // ✅ Final response
  res.json({
    summary: {
      today: summary.today ? parseInt(summary.today) : 0,
      week: summary.week ? parseInt(summary.week) : 0,
      month: summary.month ? parseInt(summary.month) : 0,
      year: summary.year ? parseInt(summary.year) : 0,
    },
    frequency,
  });
});

export {
  addExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  getAllExpenses,
  getExpenseStats,
};
