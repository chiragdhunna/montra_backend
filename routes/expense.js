import express from "express";
import {
  addExpense,
  deleteExpense,
  getExpense,
  updateExpense,
} from "../controllers/expense.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

app.post("/add", upload.single("file"), addExpense);
app.delete("/delete", deleteExpense);
app.post("/update", updateExpense);
app.get("/total", getExpense);

export default app;
