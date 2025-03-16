import express from "express";
import {
  createTransfer,
  deleteTransfer,
  getAllTransfers,
  updateTransfer,
} from "../controllers/transfer.js";

const app = express.Router();

// Create Transfer
app.post("/add", createTransfer);
// Update
app.post("/update", updateTransfer);
// Delete
app.delete("/delete", deleteTransfer);
// Get ALL
app.get("/getall", getAllTransfers);

export default app;
