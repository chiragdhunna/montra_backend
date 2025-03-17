import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import connection from "../database/db.js";

const createTransfer = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { amount, sender, receiver, isExpense } = req.body;

  const query = `INSERT INTO transfer (amount, sender, receiver, is_expense, user_id) VALUES ($1, $2, $3, $4, $5)`;

  const results = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, sender, receiver, isExpense, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Transfer not created", 501));
  }

  res.send(results);
});

const updateTransfer = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { amount, sender, receiver, isExpense, transfer_id } = req.body;

  const query = `UPDATE transfer SET amount = $1, sender = $2, receiver = $3, is_expense = $4 WHERE user_id = $5 AND transfer_id = $6`;

  const results = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, sender, receiver, isExpense, user.user_id, transfer_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Transfer not updated", 501));
  }

  res.send(results);
});

const deleteTransfer = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { transfer_id } = req.body;

  const query = `DELETE FROM transfer WHERE user_id = $1 AND transfer_id = $2`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id, transfer_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Transfer not deleted", 501));
  }

  res.send("Transfer deleted successfully");
});

const getAllTransfers = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT * FROM transfer WHERE user_id = $1`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (results.length === 0) {
    return next(new ErrorHandler("No transfers found", 404));
  }

  res.status(200).json({
    success: true,
    count: results.length,
    transfers: results,
  });
});

export { createTransfer, updateTransfer, deleteTransfer, getAllTransfers };
