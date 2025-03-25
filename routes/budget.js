import express from "express";
import {
  createBudget,
  deleteBudget,
  getAllBudget,
  getBudgetByMonth,
  updateBudget,
} from "../controllers/budget.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       required:
 *         - totalBudget
 *         - name
 *       properties:
 *         totalBudget:
 *           type: number
 *           description: Total budget amount
 *         name:
 *           type: string
 *           description: Name of the budget
 *         current:
 *           type: number
 *           description: Current amount spent from budget
 */

/**
 * @swagger
 * /api/v1/budget/create:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budget]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       200:
 *         description: Budget created successfully
 *       501:
 *         description: Budget creation failed
 */
app.post("/create", createBudget);

/**
 * @swagger
 * /api/v1/budget/update:
 *   post:
 *     summary: Update an existing budget
 *     tags: [Budget]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget_id
 *             properties:
 *               budget_id:
 *                 type: integer
 *               totalBudget:
 *                 type: number
 *               name:
 *                 type: string
 *               current:
 *                 type: number
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       404:
 *         description: Budget not found or unauthorized
 */
app.post("/update", updateBudget);

/**
 * @swagger
 * /api/v1/budget/delete:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budget]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget_id
 *             properties:
 *               budget_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       404:
 *         description: Budget not found or unauthorized
 */
app.delete("/delete", deleteBudget);

/**
 * @swagger
 * /api/v1/budget/getall:
 *   get:
 *     summary: Get all budgets for the user
 *     tags: [Budget]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 */
app.get("/getall", getAllBudget);

/**
 * @swagger
 * /api/v1/budget/getbymonth:
 *   post:
 *     summary: Get budgets for a specific month in the current year
 *     tags: [Budget]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *             properties:
 *               month:
 *                 type: integer
 *                 description: Month number (1-12)
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 3
 *     responses:
 *       200:
 *         description: List of budgets for the specified month
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Budgets for month 3 retrieved successfully"
 *                 budgets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Bad request - Invalid month or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Month is required"
 */
app.post("/getbymonth", getBudgetByMonth);

export default app;
