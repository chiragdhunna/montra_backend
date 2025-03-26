import express from "express";
import {
  createWallet,
  deleteWallet,
  getAllWalletNames,
  getAllWallets,
  getWalletBalance,
  getWalletTransactions,
  updateWallet,
} from "../controllers/wallet.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the wallet
 *         amount:
 *           type: number
 *           description: Amount in the wallet
 *           default: 0
 */

/**
 * @swagger
 * /api/v1/wallet/create:
 *   post:
 *     summary: Create a new wallet
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Wallet'
 *     responses:
 *       200:
 *         description: Wallet created successfully
 *       409:
 *         description: Wallet with this name already exists
 */
app.post("/create", createWallet);

/**
 * @swagger
 * /api/v1/wallet/update:
 *   put:
 *     summary: Update wallet details
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet_name
 *               - amount
 *               - wallet_id
 *             properties:
 *               wallet_name:
 *                 type: string
 *                 description: The name of the wallet
 *               amount:
 *                 type: number
 *                 description: The updated amount in the wallet
 *               wallet_id:
 *                 type: integer
 *                 description: The unique ID of the wallet to be updated
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       500:
 *         description: Update failed due to a server error
 */
app.put("/update", updateWallet);

/**
 * @swagger
 * /api/v1/wallet/getall:
 *   get:
 *     summary: Get all wallets
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wallet'
 */
app.get("/getall", getAllWallets);

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get total balance across all wallets
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Total wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 */
app.get("/balance", getWalletBalance);

/**
 * @swagger
 * /api/v1/wallet/delete:
 *   delete:
 *     summary: Delete a wallet
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletNumber
 *             properties:
 *               walletNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *       404:
 *         description: No wallet found to delete
 */
app.delete("/delete", deleteWallet);

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   post:
 *     summary: Retrieve wallet transactions (income & expenses)
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet_name
 *             properties:
 *               wallet_name:
 *                 type: string
 *                 description: Name of the wallet to fetch transactions for
 *     responses:
 *       200:
 *         description: List of income and expense transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incomes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       category:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *                 expenses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       category:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *       400:
 *         description: Bad request, missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
app.post("/transactions", getWalletTransactions);

/**
 * @swagger
 * /api/v1/wallet/wallets:
 *   get:
 *     summary: Get all wallet names for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of wallet names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallets:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "Wallet Name 1"
 *                     - "Wallet Name 2"
 *                     - "Wallet Name 3"
 *                     - "Wallet Name 4"
 *                     - "Wallet Name 5"
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
app.get("/wallets", getAllWalletNames);

export default app;
