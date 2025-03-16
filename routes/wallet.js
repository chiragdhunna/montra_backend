import express from "express";
import {
  createWallet,
  deleteWallet,
  getAllWallets,
  getWalletBalance,
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
 *   post:
 *     summary: Update wallet amount
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
 *               - walletName
 *               - amount
 *             properties:
 *               walletName:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *       500:
 *         description: Update failed
 */
app.post("/update", updateWallet);

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

export default app;
