import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { bankNames } from "../constants/bank.js";

const createBankAccount = TryCatch(async (req, res, next, err) => {
  const { user } = req;
  const { amount, bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const bankCheckQuery = `select * from bank where name = ?`;

  const [result] = await connection.promise().query(bankCheckQuery, [bankName]);

  if (result.length != 0)
    return next(new ErrorHandler("Bank already exists", 409));

  const insertQuery = `insert into bank (name,amount,user_id) values (?,?,?)`;

  const [insertResult] = await connection
    .promise()
    .query(insertQuery, [bankName, amount, user.user_id]);

  res.json({ success: insertResult });
});

const deleteBankAccount = TryCatch(async (req, res, err, next) => {
  const user = req.user;
  const { bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const query = `delete from bank where user_id = ? and name = ?`;

  const [result] = await connection
    .promise()
    .query(query, [user.user_id, bankName]);

  if (result.affectedRows === 0) {
    return next(new ErrorHandler("No bank account found to delete", 404));
  }

  res.send("Bank Deleted Successfully");
});

const updateBankAccount = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { amount, bankName } = req.body;

  const isValidBankName = (name) => bankNames.includes(name);

  if (!isValidBankName(bankName)) {
    return next(new ErrorHandler("Invalid bank name", 400));
  }

  const query = `update bank set amount = ? where user_id = ? and name = ?`;

  const result = await connection
    .promise()
    .query(query, [amount, user.user_id, bankName]);

  if (result[0].affectedRows === 0) {
    return next(new ErrorHandler("Bank Update UnSuccessfull", 500));
  }

  res.send(result[0]);
});

const getAllBankAccounts = TryCatch(async (req, res, err, next) => {
  const user = req.user;

  const query = `select * from bank where user_id = ?`;

  const result = await connection.promise().query(query, [user.user_id]);

  res.send(result[0]);
});

const getBalance = TryCatch(async (req, res, err, next) => {
  const user = req.user;

  const query = `select SUM(amount) as balance from bank where user_id = ?`;

  const result = await connection.promise().query(query, [user.user_id]);

  res.send(result[0]);
});

export {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
  getAllBankAccounts,
  getBalance,
};
