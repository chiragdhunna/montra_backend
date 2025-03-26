import express from "express";
import {
  createBankAccount,
  deleteBankAccount,
  getAllBankAccounts,
  getBalance,
  getBankTransactions,
  updateBankAccount,
} from "../controllers/bank.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Bank:
 *       type: object
 *       required:
 *         - bankName
 *         - amount
 *       properties:
 *         bankName:
 *           type: string
 *           description: Name of the bank
 *           enum: [  Chase, PayPal, Citi, Bank of America, Jago, Mandiri, BCA]
 *         amount:
 *           type: number
 *           description: Amount in the bank account
 */

/**
 * @swagger
 * /api/v1/bank/create:
 *   post:
 *     summary: Create a new bank account
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bank'
 *     responses:
 *       200:
 *         description: Bank account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid bank name
 *       409:
 *         description: Bank already exists
 */
app.post("/create", createBankAccount);

/**
 * @swagger
 * /api/v1/bank/get:
 *   get:
 *     summary: Get all bank accounts
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all bank accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
app.get("/get", getAllBankAccounts);

/**
 * @swagger
 * /api/v1/bank/delete:
 *   delete:
 *     summary: Delete a bank account
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *             properties:
 *               bankName:
 *                 type: string
 *                 enum: [Chase, PayPal, Citi, Bank of America, Jago, Mandiri, BCA]
 *     responses:
 *       200:
 *         description: Bank account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Bank Deleted Successfully"
 *       400:
 *         description: Invalid bank name
 *       404:
 *         description: No bank account found to delete
 */
app.delete("/delete", deleteBankAccount);

/**
 * @swagger
 * /api/v1/bank/update:
 *   post:
 *     summary: Update bank account details
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_number
 *               - amount
 *             properties:
 *               account_number:
 *                 type: string
 *                 description: The account number associated with the bank account
 *               amount:
 *                 type: number
 *                 description: The new amount to update in the bank account
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Internal server error
 */
app.post("/update", updateBankAccount);

/**
 * @swagger
 * /api/v1/bank/balance:
 *   get:
 *     summary: Get total balance across all bank accounts
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Total balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: Total balance across all bank accounts
 *       404:
 *         description: No bank accounts found
 */
app.get("/balance", getBalance);

/**
 * @swagger
 * /api/v1/bank/transactions:
 *   post:
 *     summary: Retrieve all transactions (income and expenses) for a specific bank
 *     tags: [Banks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_name
 *             properties:
 *               bank_name:
 *                 type: string
 *                 description: The name of the bank to retrieve transactions for
 *     responses:
 *       200:
 *         description: Successfully retrieved transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incomeResults:
 *                   type: array
 *                   description: List of income transactions
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Transaction ID
 *                       amount:
 *                         type: number
 *                         description: Amount of income
 *                       bank_name:
 *                         type: string
 *                         description: Name of the bank
 *                       user_id:
 *                         type: integer
 *                         description: User ID
 *                 expenseResults:
 *                   type: array
 *                   description: List of expense transactions
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Transaction ID
 *                       amount:
 *                         type: number
 *                         description: Amount of expense
 *                       bank_name:
 *                         type: string
 *                         description: Name of the bank
 *                       user_id:
 *                         type: integer
 *                         description: User ID
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: No transactions found for the given bank
 *       500:
 *         description: Internal server error
 */
app.post("/transactions", getBankTransactions);

export default app;
