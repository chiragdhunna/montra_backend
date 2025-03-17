import { incomeSource } from "../constants/income.js";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import fs from "fs";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

const addIncome = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { amount, source, description } = req.body;

  const isValidSourceName = (name) => incomeSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid income source", 400));
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

  const query = `INSERT INTO income (amount, source, attachment, description, user_id) VALUES ($1, $2, $3, $4, $5)`;

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

const updateIncome = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { incomeId, amount, source, description } = req.body;

  const query = `UPDATE income SET amount = $1, source = $2, description = $3 WHERE income_id = $4 AND user_id = $5`;

  const results = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, source, description, incomeId, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  res.send(results);
});

const deleteIncome = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { incomeId } = req.body;

  // First, fetch the attachment path
  const fetchQuery = `SELECT attachment FROM income WHERE income_id = $1 AND user_id = $2`;

  const attachmentResult = await new Promise((resolve, reject) => {
    connection.query(fetchQuery, [incomeId, user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  // If no income found, return error
  if (attachmentResult.rowCount === 0) {
    return next(new ErrorHandler("Income not found", 404));
  }

  // Get the attachment path
  const attachmentPath = attachmentResult[0].attachment;

  // Delete the income from database
  const deleteQuery = `DELETE FROM income WHERE income_id = $1 AND user_id = $2`;

  const results = await new Promise((resolve, reject) => {
    connection.query(deleteQuery, [incomeId, user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Income not deleted", 500));
  }

  // Delete the attachment file
  try {
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      await unlinkAsync(attachmentPath);
    }
  } catch (error) {
    console.error("Error deleting attachment:", error);
  }

  res.send("Income deleted successfully");
});

const getIncome = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT SUM(amount) as income FROM income WHERE user_id = $1`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.send(results);
});

const getAllIncomes = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT * FROM income WHERE user_id = $1 ORDER BY created_at DESC`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.status(200).json({
    success: true,
    count: results[0].length,
    incomes: results,
  });
});

export { addIncome, updateIncome, deleteIncome, getIncome, getAllIncomes };
