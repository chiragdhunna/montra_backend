import express from "express";
import {
  addExpense,
  deleteExpense,
  getExpense,
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
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       200:
 *         description: Expense added successfully
 *       400:
 *         description: Invalid expense source
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

export default app;
