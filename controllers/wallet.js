import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const createWallet = TryCatch(async (req, res, next) => {
  const { user } = req;
  const { name, amount } = req.body;

  if (!name) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const walletCheckQuery = `SELECT * FROM wallet WHERE name = $1 AND user_id = $2`;

  const result = await new Promise((resolve, reject) => {
    connection.query(walletCheckQuery, [name, user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (result.length !== 0) {
    return next(new ErrorHandler("Wallet with this name already exists", 409));
  }

  const insertQuery = `INSERT INTO wallet (name, amount, user_id) VALUES ($1, $2, $3)`;

  await new Promise((resolve, reject) => {
    connection.query(
      insertQuery,
      [name, amount || 0, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  res.json({ success: true });
});

const deleteWallet = TryCatch(async (req, res, next) => {
  const user = req.user;
  const { walletNumber } = req.body;

  if (!walletNumber) {
    return next(new ErrorHandler("Wallet number is required", 400));
  }

  const query = `DELETE FROM wallet WHERE user_id = $1 AND wallet_number = $2`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id, walletNumber], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (result.rowCount === 0) {
    return next(new ErrorHandler("No wallet found to delete", 404));
  }

  res.send("Wallet Deleted Successfully");
});

const updateWallet = TryCatch(async (req, res, next) => {
  const user = req.user;
  const { amount, wallet_name, wallet_id } = req.body;

  if (!wallet_name) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const query = `UPDATE wallet SET amount = $1, name = $2 WHERE user_id = $3 AND wallet_number = $4`;

  const result = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, wallet_name, user.user_id, wallet_id], // Corrected order
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });

  if (result.rowCount === 0) {
    // Ensure compatibility with DB type
    return next(new ErrorHandler("Wallet Update Unsuccessful", 500));
  }

  res.send({ success: true, message: "Wallet updated successfully" });
});

const getAllWalletNames = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT name FROM wallet WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  const walletNames = result.map((wallet) => wallet.name);

  res.send({ wallets: walletNames });
});

const getWalletBalance = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT SUM(amount) as balance FROM wallet WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
  const balance = result.balance ? parseInt(result.balance, 10) : 0;

  res.send({ balance });
});

const getAllWallets = TryCatch(async (req, res, next) => {
  const user = req.user;

  const walletCheckQuery = `SELECT * FROM wallet WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(walletCheckQuery, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.send({ wallets: result });
});

const getWalletTransactions = TryCatch(async (req, res, next, err) => {
  const { wallet_name } = req.body;
  const user = req.user;

  const incomeQuery = `select * from income where user_id = $1 and wallet_name = $2`;
  const expenseQuery = `select * from expense where user_id = $1 and wallet_name = $2`;

  const [incomeResults, expenseResults] = await Promise.all([
    new Promise((resolve, reject) => {
      connection.query(
        incomeQuery,
        [user.user_id, wallet_name],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    }),
    new Promise((resolve, reject) => {
      connection.query(
        expenseQuery,
        [user.user_id, wallet_name],
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
  createWallet,
  deleteWallet,
  updateWallet,
  getAllWallets,
  getWalletBalance,
  getWalletTransactions,
  getAllWalletNames,
};
