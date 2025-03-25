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
  const { amount, walletName } = req.body;

  if (!walletName) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const query = `UPDATE wallet SET amount = $1 WHERE user_id = $2 AND name = $3`;

  const result = await new Promise((resolve, reject) => {
    connection.query(
      query,
      [amount, user.user_id, walletName],
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
    return next(new ErrorHandler("Wallet Update Unsuccessful", 500));
  }

  res.send(result);
});

const getAllWallets = TryCatch(async (req, res, next) => {
  const user = req.user;

  const query = `SELECT * FROM wallet WHERE user_id = $1`;

  const result = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  res.send(result);
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

export {
  createWallet,
  deleteWallet,
  updateWallet,
  getAllWallets,
  getWalletBalance,
};
