import express from "express";
import {
  addIncome,
  deleteIncome,
  getIncome,
  updateIncome,
} from "../controllers/income.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

app.post("/add", upload.single("file"), addIncome);
app.delete("/delete", deleteIncome);
app.post("/update", updateIncome);
app.get("/total", getIncome);

export default app;
