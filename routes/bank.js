import express from "express";
import { authentication } from "../middlewares/auth.js";
import {
  createBankAccount,
  deleteBankAccount,
  getAllBankAccounts,
  getBalance,
  updateBankAccount,
} from "../controllers/bank.js";

const app = express.Router();

app.use(authentication);

app.post("/create", createBankAccount);
app.delete("/delete", deleteBankAccount);
app.post("/update", updateBankAccount);
app.get("/get", getAllBankAccounts);
app.get("/balance", getBalance);

export default app;
