import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { bankNames } from "../constants/bank.js";

const createBankAccount = TryCatch(async (req, res, next) => {
  const { user } = req;
  const { amount, bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const bankCheckQuery = `SELECT * FROM bank WHERE name = $1`;

  const bankCheckResult = await new Promise((resolve, reject) => {
    connection.query(bankCheckQuery, [bankName], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  if (bankCheckResult.length !== 0)
    return next(new ErrorHandler("Bank already exists", 409));

  const insertQuery = `INSERT INTO bank (name, amount, user_id) VALUES ($1, $2, $3)`;

  await new Promise((resolve, reject) => {
    connection.query(insertQuery, [bankName, amount, user.user_id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.json({ success: true });
});

const deleteBankAccount = TryCatch(async (req, res, next) => {
  const user = req.user;
  const { bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const query = `DELETE FROM bank WHERE user_id = $1 AND name = $2`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id, bankName], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (result.rowCount === 0) {
    return next(new ErrorHandler("No bank account found to delete", 404));
  }

  res.send("Bank Deleted Successfully");
});

const updateBankAccount = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { amount, bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const query = `UPDATE bank SET amount = $1 WHERE user_id = $2 AND name = $3`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [amount, user.user_id, bankName], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (result.rowCount === 0) {
    return next(new ErrorHandler("Bank Update Unsuccessful", 500));
  }

  res.send({ success: true });
});

const getAllBankAccounts = TryCatch(async (req, res) => {
  const user = req.user;

  const query = `SELECT * FROM bank WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.send(result);
});

const getBalance = TryCatch(async (req, res) => {
  const user = req.user;

  const query = `SELECT SUM(amount) as balance FROM bank WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0]);
    });
  });

  const balance = result.balance ? parseInt(result.balance, 10) : 0;

  res.send({ balance });
});

export {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
  getAllBankAccounts,
  getBalance,
};
