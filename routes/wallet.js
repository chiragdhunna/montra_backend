import express from "express";
import { authentication } from "../middlewares/auth.js";
import {
  createWallet,
  deleteWallet,
  getAllWallets,
  getWalletBalance,
  updateWallet,
} from "../controllers/wallet.js";

const app = express.Router();

app.use(authentication);

app.post("/create", createWallet);
app.delete("/delete", deleteWallet);
app.post("/update", updateWallet);
app.get("/getall", getAllWallets);
app.get("/balance", getWalletBalance);

export default app;
