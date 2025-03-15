import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const createWallet = TryCatch(async (req, res, next, err) => {
  const { user } = req;
  const { name, amount } = req.body;

  if (!name) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const walletCheckQuery = `SELECT * FROM wallet WHERE name = ? AND user_id = ?`;

  const [result] = await connection
    .promise()
    .query(walletCheckQuery, [name, user.user_id]);

  if (result.length !== 0) {
    return next(new ErrorHandler("Wallet with this name already exists", 409));
  }

  const insertQuery = `INSERT INTO wallet (name, amount, user_id) VALUES (?, ?, ?)`;

  const [insertResult] = await connection
    .promise()
    .query(insertQuery, [name, amount || 0, user.user_id]);

  res.json({ success: insertResult });
});

const deleteWallet = TryCatch(async (req, res, next, err) => {
  const user = req.user;
  const { walletName } = req.body;

  if (!walletName) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const query = `DELETE FROM wallet WHERE user_id = ? AND name = ?`;

  const [result] = await connection
    .promise()
    .query(query, [user.user_id, walletName]);

  if (result.affectedRows === 0) {
    return next(new ErrorHandler("No wallet found to delete", 404));
  }

  res.send("Wallet Deleted Successfully");
});

const updateWallet = TryCatch(async (req, res, next, err) => {
  const user = req.user;
  const { amount, walletName } = req.body;

  if (!walletName) {
    return next(new ErrorHandler("Wallet name is required", 400));
  }

  const query = `UPDATE wallet SET amount = ? WHERE user_id = ? AND name = ?`;

  const result = await connection
    .promise()
    .query(query, [amount, user.user_id, walletName]);

  if (result[0].affectedRows === 0) {
    return next(new ErrorHandler("Wallet Update Unsuccessful", 500));
  }

  res.send(result[0]);
});

const getAllWallets = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `SELECT * FROM wallet WHERE user_id = ?`;

  const result = await connection.promise().query(query, [user.user_id]);

  res.send(result[0]);
});

const getWalletBalance = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `SELECT SUM(amount) as balance FROM wallet WHERE user_id = ?`;

  const result = await connection.promise().query(query, [user.user_id]);

  res.send(result[0]);
});

export {
  createWallet,
  deleteWallet,
  updateWallet,
  getAllWallets,
  getWalletBalance,
};
