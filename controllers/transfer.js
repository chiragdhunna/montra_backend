import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import connection from "../database/db.js";

const createTransfer = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { amount, sender, receiver, isExpense } = req.body;

  const query = `INSERT INTO transfer (amount, sender, receiver, is_expense, user_id) VALUES (?, ?, ?, ?, ?)`;

  const results = await connection
    .promise()
    .query(query, [amount, sender, receiver, isExpense, user.user_id]);

  if (results[0].affectedRows === 0)
    return next(new ErrorHandler("Tranfer not created", 501));

  res.send(results[0]);
});

const updateTransfer = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { amount, sender, receiver, isExpense, transfer_id } = req.body;

  const query = `update transfer set amount = ?, sender = ?, receiver = ?, is_expense = ? where user_id =? and transfer_id  = ?`;

  const results = await connection
    .promise()
    .query(query, [
      amount,
      sender,
      receiver,
      isExpense,
      user.user_id,
      transfer_id,
    ]);

  if (results[0].affectedRows === 0)
    return next(new ErrorHandler("Tranfer not created", 501));

  res.send(results[0]);
});

const deleteTransfer = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { transfer_id } = req.body;

  const query = `delete from transfer where user_id =? and transfer_id  = ?`;

  const results = await connection
    .promise()
    .query(query, [user.user_id, transfer_id]);

  if (results[0].affectedRows === 0)
    return next(new ErrorHandler("Tranfer not created", 501));

  res.send(results[0]);
});

const getAllTransfers = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `select * from transfer where user_id =?`;

  const results = await connection.promise().query(query, [user.user_id]);

  if (results[0].affectedRows === 0)
    return next(new ErrorHandler("Tranfer not created", 501));

  res.send(results[0]);
});

export { createTransfer, updateTransfer, deleteTransfer, getAllTransfers };
