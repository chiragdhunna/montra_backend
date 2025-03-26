import { bankNames } from "../constants/bank.js";
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

  const isValidSourceName = (name) => incomeSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid income source", 400));
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
    const query = `INSERT INTO income (amount, source, attachment, description, user_id, bank_name) VALUES ($1, $2, $3, $4, $5, $6)`;

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
    const query = `INSERT INTO income (amount, source, attachment, description, user_id, wallet_name) VALUES ($1, $2, $3, $4, $5, $6)`;

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
  }

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

  res.json({ income: results[0].income ? parseInt(results[0].income) : 0 });
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
    incomes: results,
  });
});

export { addIncome, updateIncome, deleteIncome, getIncome, getAllIncomes };
