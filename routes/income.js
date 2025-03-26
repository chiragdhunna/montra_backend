import express from "express";
import {
  addIncome,
  deleteIncome,
  getAllIncomes,
  getIncome,
  updateIncome,
} from "../controllers/income.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Income:
 *       type: object
 *       required:
 *         - amount
 *         - source
 *         - description
 *       properties:
 *         amount:
 *           type: number
 *           description: Income amount
 *         source:
 *           type: string
 *           enum: [wallet, bank, cash, credit card]
 *           description: Source of income
 *         description:
 *           type: string
 *           description: Description of the income
 *         file:
 *           type: string
 *           format: binary
 *           description: Proof of income (jpeg/png/jpg under 5MB)
 */

/**
 * @swagger
 * /api/v1/income/add:
 *   post:
 *     summary: Add a new income
 *     tags: [Income]
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
 *                 description: The amount of income
 *               source:
 *                 type: string
 *                 description: The source of income
 *               description:
 *                 type: string
 *                 description: Additional details about the income
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
 *         description: Income added successfully
 *       400:
 *         description: Invalid income source or bank name
 *       413:
 *         description: File upload failed or invalid file
 */
app.post("/add", upload.single("file"), addIncome);

/**
 * @swagger
 * /api/v1/income/update:
 *   post:
 *     summary: Update an income record
 *     tags: [Income]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incomeId
 *             properties:
 *               incomeId:
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
 *         description: Income updated successfully
 */
app.post("/update", updateIncome);

/**
 * @swagger
 * /api/v1/income/get:
 *   get:
 *     summary: Get total income
 *     tags: [Income]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all income records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Income'
 */
app.get("/get", getIncome);

/**
 * @swagger
 * /api/v1/income/delete:
 *   delete:
 *     summary: Delete an income record
 *     tags: [Income]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incomeId
 *             properties:
 *               incomeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Income record deleted successfully
 *       404:
 *         description: Income record not found
 */
app.delete("/delete", deleteIncome);

/**
 * @swagger
 * /api/v1/income/all:
 *   get:
 *     summary: Get all incomes for the authenticated user
 *     tags: [Income]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all incomes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Income'
 */
app.get("/all", getAllIncomes);

export default app;
