import express from "express";
import {
  createBudget,
  deleteBudget,
  getAllBudget,
  updateBudget,
} from "../controllers/budget.js";

const app = express.Router();

app.post("/create", createBudget);
app.post("/update", updateBudget);
app.delete("/delete", deleteBudget);
app.get("/getall", getAllBudget);

export default app;
