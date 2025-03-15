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

app.post("/createaccount", createBankAccount);
app.delete("/deleteaccount", deleteBankAccount);
app.post("/updateaccount", updateBankAccount);
app.get("/getaccount", getAllBankAccounts);
app.get("/balance", getBalance);

export default app;
