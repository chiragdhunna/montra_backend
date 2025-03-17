import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const createBudget = TryCatch(async (req, res, next) => {
  const user = req.user;

  const { totalBudget, name } = req.body;

  const query = `INSERT INTO budget (total_budget, name, user_id) VALUES ($1, $2, $3)`;

  await new Promise((resolve, reject) => {
    connection.query(
      query,
      [totalBudget, name, user.user_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else if (result.rowCount === 0) {
          return next(new ErrorHandler("Budget not created", 501));
        } else {
          resolve(result);
        }
      }
    );
  });

  res.send({ success: true });
});

const updateBudget = TryCatch(async (req, res, next) => {
  const user = req.user;
  const { budget_id, totalBudget, name, current } = req.body;

  // Validate that budget belongs to user first
  const validateQuery = `SELECT * FROM budget WHERE budget_id = $1 AND user_id = $2`;

  const validateResults = await new Promise((resolve, reject) => {
    connection.query(
      validateQuery,
      [budget_id, user.user_id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  if (validateResults.rows.length === 0) {
    return next(new ErrorHandler("Budget not found or unauthorized", 404));
  }

  // Build dynamic update query based on provided fields
  let updateFields = [];
  let params = [];

  if (totalBudget !== undefined) {
    updateFields.push(`total_budget = $${params.length + 1}`);
    params.push(totalBudget);
  }

  if (name !== undefined) {
    updateFields.push(`name = $${params.length + 1}`);
    params.push(name);
  }

  if (current !== undefined) {
    updateFields.push(`current = $${params.length + 1}`);
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
  )} WHERE budget_id = $${params.length - 1} AND user_id = $${params.length}`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Budget not updated", 500));
  }

  res.status(200).json({
    success: true,
    message: "Budget updated successfully",
    affectedRows: results.rowCount,
  });
});

const deleteBudget = TryCatch(async (req, res, next) => {
  const user = req.user;
  const { budget_id } = req.body;

  if (!budget_id) {
    return next(new ErrorHandler("Budget ID is required", 400));
  }

  const query = `DELETE FROM budget WHERE budget_id = $1 AND user_id = $2`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [budget_id, user.user_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (results.rowCount === 0) {
    return next(new ErrorHandler("Budget not found or unauthorized", 404));
  }

  res.status(200).json({
    success: true,
    message: "Budget deleted successfully",
    affectedRows: results.rowCount,
  });
});

const getAllBudget = TryCatch(async (req, res) => {
  const user = req.user;

  const query = `SELECT * FROM budget WHERE user_id = $1`;

  const results = await new Promise((resolve, reject) => {
    connection.query(query, [user.user_id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  console.log({ results });

  res.status(200).json({
    success: true,
    count: results.rows,
    data: results,
  });
});

export { createBudget, updateBudget, deleteBudget, getAllBudget };
