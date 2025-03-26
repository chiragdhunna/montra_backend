import express from "express";
import {
  addExpense,
  deleteExpense,
  getAllExpenses,
  getExpense,
  getExpenseStats,
  updateExpense,
} from "../controllers/expense.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       required:
 *         - amount
 *         - source
 *         - description
 *       properties:
 *         amount:
 *           type: number
 *           description: Expense amount
 *         source:
 *           type: string
 *           enum: [wallet, bank, cash, credit card]
 *           description: Source of expense
 *         description:
 *           type: string
 *           description: Description of the expense
 *         file:
 *           type: string
 *           format: binary
 *           description: Receipt or proof of expense (jpeg/png/jpg under 5MB)
 */

/**
 * @swagger
 * /api/v1/expense/add:
 *   post:
 *     summary: Add a new expense
 *     tags: [Expense]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount of the expense
 *               source:
 *                 type: string
 *                 description: The source of the expense
 *               description:
 *                 type: string
 *                 description: Additional details about the expense
 *               bank_name:
 *                 type: string
 *                 nullable: true
 *                 description: The bank name (if applicable)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Attachment file (JPEG under 5MB)
 *     responses:
 *       200:
 *         description: Expense added successfully
 *       400:
 *         description: Invalid expense source or bank name
 *       413:
 *         description: File upload failed or invalid file
 */
app.post("/add", upload.single("file"), addExpense);

/**
 * @swagger
 * /api/v1/expense/update:
 *   post:
 *     summary: Update an expense
 *     tags: [Expense]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expenseId
 *             properties:
 *               expenseId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               source:
 *                 type: string
 *                 enum: [wallet, bank, cash, credit card]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense updated successfully
 */
app.post("/update", updateExpense);

/**
 * @swagger
 * /api/v1/expense/get:
 *   get:
 *     summary: Get all expenses
 *     tags: [Expense]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
app.get("/get", getExpense);

/**
 * @swagger
 * /api/v1/expense/delete:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expense]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expenseId
 *             properties:
 *               expenseId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       404:
 *         description: Expense not found
 */
app.delete("/delete", deleteExpense);

/**
 * @swagger
 * /api/v1/expense/getAll:
 *   get:
 *     summary: Get all expenses for the authenticated user
 *     tags: [Expense]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all expenses for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 */
app.get("/getAll", getAllExpenses);

/**
 * @swagger
 * /api/v1/expense/stats:
 *   get:
 *     summary: Get detailed expense statistics
 *     description: Retrieve total expenses for today, this week, this month, and this year, along with grouped frequency data.
 *     tags:
 *       - Expense
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Expense statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: number
 *                       description: Total expenses for today.
 *                     week:
 *                       type: number
 *                       description: Total expenses for the current week.
 *                     month:
 *                       type: number
 *                       description: Total expenses for the current month.
 *                     year:
 *                       type: number
 *                       description: Total expenses for the current year.
 *                 frequency:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             description: Hour of the day.
 *                           total:
 *                             type: number
 *                             description: Total expenses for that hour.
 *                     week:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             description: Day of the week.
 *                           total:
 *                             type: number
 *                             description: Total expenses for that day.
 *                     month:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             description: Day of the month.
 *                           total:
 *                             type: number
 *                             description: Total expenses for that day.
 *                     year:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             description: Month of the year.
 *                           total:
 *                             type: number
 *                             description: Total expenses for that month.
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 *       500:
 *         description: Internal server error.
 */
app.get("/stats", getExpenseStats);

export default app;
