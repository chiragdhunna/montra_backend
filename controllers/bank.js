import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { bankNames } from "../constants/bank.js";

const createBankAccount = TryCatch(async (req, res, next) => {
  const { user } = req;
  const { amount, bank_name } = req.body;
  const bankName = req.body.bank_name;

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

  const { amount, account_number } = req.body;

  const query = `UPDATE bank SET amount = $1 WHERE user_id = $2 and account_number = $3`;

  const result = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, user.user_id, account_number],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
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

  res.send({ banks: result });
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

const getBankTransactions = TryCatch(async (req, res, next, err) => {
  const { bank_name } = req.body;
  const user = req.user;

  const incomeQuery = `select * from income where user_id = $1 and bank_name = $2`;
  const expenseQuery = `select * from expense where user_id = $1 and bank_name = $2`;

  const [incomeResults, expenseResults] = await Promise.all([
    new Promise((resolve, reject) => {
      connection.query(
        incomeQuery,
        [user.user_id, bank_name],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    }),
    new Promise((resolve, reject) => {
      connection.query(
        expenseQuery,
        [user.user_id, bank_name],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    }),
  ]);

  res.json({
    incomes: incomeResults,
    expenses: expenseResults,
  });
});

export {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
  getAllBankAccounts,
  getBalance,
  getBankTransactions,
};
