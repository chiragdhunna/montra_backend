import express from "express";
import { exportData, getImage, imageUpload, login, signup } from "../controllers/user.js";
import { authentication } from "../middlewares/auth.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - pin
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password (will be hashed)
 *         pin:
 *           type: string
 *           description: User's security PIN
 *         imgUrl:
 *           type: string
 *           description: URL to user's profile image
 */

/**
 * @swagger
 * /api/v1/user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or email already exists
 */
app.post("/signup", signup);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid credentials
 */
app.post("/login", login);

app.use(authentication);

/**
 * @swagger
 * /api/v1/user/imageupload:
 *   post:
 *     summary: Upload user profile image
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpeg/png/jpg under 5MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: Success message with file path
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large or invalid format
 */
app.post("/imageupload", upload.single("file"), imageUpload);

/**
 * @swagger
 * /api/v1/user/getimage:
 *   get:
 *     summary: Get user's profile image
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User's profile image
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
app.get("/getimage", getImage);

/**
 * @swagger
 * /api/v1/user/export:
 *   post:
 *     summary: Export user's financial data
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataType:
 *                 type: string
 *                 enum: [all, expense, income, transfer, budget]
 *                 default: all
 *                 description: Type of data to export
 *               dateRange:
 *                 type: string
 *                 enum: [1month, 6months, lastQuarter, lastYear]
 *                 default: 1month
 *                 description: Time period for the export
 *               format:
 *                 type: string
 *                 enum: [csv, pdf]
 *                 default: csv
 *                 description: Export file format
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: No data available for export
 *       500:
 *         description: Error generating export file
 */
app.post("/export", exportData);

export default app;
