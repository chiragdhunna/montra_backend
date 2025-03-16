import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const createBudget = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { totalBudget, name } = req.body;

  const query = `insert into budget (total_budget,name,user_id) values (?,?,?)`;

  const results = await connection
    .promise()
    .query(query, [totalBudget, name, user.user_id]);

  if (results[0].affectedRows === 0) {
    return next(new ErrorHandler("Budget not created", 501));
  }

  res.send(results[0]);
});

const updateBudget = TryCatch(async (req, res, next, err) => {
  const user = req.user;
  const { budget_id, totalBudget, name, current } = req.body;

  // Validate that budget belongs to user first
  const validateQuery = `SELECT * FROM budget WHERE budget_id = ? AND user_id = ?`;
  const validateResults = await connection
    .promise()
    .query(validateQuery, [budget_id, user.user_id]);

  if (validateResults[0].length === 0) {
    return next(new ErrorHandler("Budget not found or unauthorized", 404));
  }

  // Build dynamic update query based on provided fields
  let updateFields = [];
  let params = [];

  if (totalBudget !== undefined) {
    updateFields.push("total_budget = ?");
    params.push(totalBudget);
  }

  if (name !== undefined) {
    updateFields.push("name = ?");
    params.push(name);
  }

  if (current !== undefined) {
    updateFields.push("current = ?");
    params.push(current);
  }

  // If no fields to update, return early
  if (updateFields.length === 0) {
    return next(new ErrorHandler("No fields to update", 400));
  }

  // Add budget_id and user_id to params
  params.push(budget_id);
  params.push(user.user_id);

  const query = `UPDATE budget SET ${updateFields.join(
    ", "
  )} WHERE budget_id = ? AND user_id = ?`;

  const results = await connection.promise().query(query, params);

  if (results[0].affectedRows === 0) {
    return next(new ErrorHandler("Budget not updated", 500));
  }

  res.status(200).json({
    success: true,
    message: "Budget updated successfully",
    affectedRows: results[0].affectedRows,
  });
});

const deleteBudget = TryCatch(async (req, res, next, err) => {
  const user = req.user;
  const { budget_id } = req.body;

  if (!budget_id) {
    return next(new ErrorHandler("Budget ID is required", 400));
  }

  const query = `DELETE FROM budget WHERE budget_id = ? AND user_id = ?`;

  const results = await connection
    .promise()
    .query(query, [budget_id, user.user_id]);

  if (results[0].affectedRows === 0) {
    return next(new ErrorHandler("Budget not found or unauthorized", 404));
  }

  res.status(200).json({
    success: true,
    message: "Budget deleted successfully",
    affectedRows: results[0].affectedRows,
  });
});

const getAllBudget = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `SELECT * FROM budget WHERE user_id = ?`;

  const [budgets] = await connection.promise().query(query, [user.user_id]);

  res.status(200).json({
    success: true,
    count: budgets.length,
    data: budgets,
  });
});

export { createBudget, updateBudget, deleteBudget, getAllBudget };
