import express from "express";
import {
  createTransfer,
  deleteTransfer,
  getAllTransfers,
  updateTransfer,
} from "../controllers/transfer.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transfer:
 *       type: object
 *       required:
 *         - amount
 *         - sender
 *         - receiver
 *         - isExpense
 *       properties:
 *         amount:
 *           type: number
 *           description: Transfer amount
 *         sender:
 *           type: string
 *           description: Source account/wallet
 *         receiver:
 *           type: string
 *           description: Destination account/wallet
 *         isExpense:
 *           type: boolean
 *           description: Whether this transfer is an expense
 */

/**
 * @swagger
 * /api/v1/transfer/add:
 *   post:
 *     summary: Create a new transfer
 *     tags: [Transfer]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transfer'
 *     responses:
 *       200:
 *         description: Transfer created successfully
 *       501:
 *         description: Transfer creation failed
 */
app.post("/add", createTransfer);

/**
 * @swagger
 * /api/v1/transfer/update:
 *   post:
 *     summary: Update a transfer
 *     tags: [Transfer]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transfer_id
 *             properties:
 *               transfer_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               sender:
 *                 type: string
 *               receiver:
 *                 type: string
 *               isExpense:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Transfer updated successfully
 *       501:
 *         description: Transfer update failed
 */
app.post("/update", updateTransfer);

/**
 * @swagger
 * /api/v1/transfer/getall:
 *   get:
 *     summary: Get all transfers
 *     tags: [Transfer]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transfer'
 */
app.get("/getall", getAllTransfers);

/**
 * @swagger
 * /api/v1/transfer/delete:
 *   delete:
 *     summary: Delete a transfer
 *     tags: [Transfer]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transfer_id
 *             properties:
 *               transfer_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer deleted successfully
 *       501:
 *         description: Transfer deletion failed
 */
app.delete("/delete", deleteTransfer);

export default app;
