import { expenseSource } from "../constants/expense.js";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const addExpense = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { amount, source, description } = req.body;

  const isValidSourceName = (name) => expenseSource.includes(name);

  if (!isValidSourceName(source)) {
    return next(new ErrorHandler("Invalid expense source", 400));
  }

  // check whether req.file contains the file
  // if not multer is failed to parse so notify the client
  if (!req.file) {
    res.status(413).send(`File not uploaded!, Please
    					attach jpeg file under 5 MB`);
    return;
  }

  const attachment = req.file.path;

  const query = `insert into expense (amount, source, attachment, description, user_id) values (?,?,?,?,?)`;

  const results = await connection
    .promise()
    .query(query, [amount, source, attachment, description, user.user_id]);

  res.send({ results });
});

const updateExpense = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { expenseId, amount, source, description } = req.body;

  const query = `update expense set amount = ?, source = ?,  description = ? where expense_id = ? and user_id = ?`;

  const results = await connection
    .promise()
    .query(query, [amount, source, description, expenseId, user.user_id]);

  res.send(results[0]);
});

const deleteExpense = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { expenseId } = req.body;

  const query = `delete from expense where expense_id = ? and user_id = ?`;

  const results = await connection
    .promise()
    .query(query, [expenseId, user.user_id]);

  if (results[0].affectedRows === 0) {
    return next(new ErrorHandler("DB not update", 500));
  }

  res.send(results[0]);
});

const getExpense = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `select SUM(amount) as expense from expense where user_id = ?`;

  const results = await connection.promise().query(query, [user.user_id]);

  res.send(results[0]);
});

export { addExpense, updateExpense, deleteExpense, getExpense };
