import "dotenv/config";

import express from "express";
import path from "path";

import userRoute from "./routes/user.js";
import bankRoute from "./routes/bank.js";
import walletRoute from "./routes/wallet.js";
import incomeRoute from "./routes/income.js";
import expenseRoute from "./routes/expense.js";
import transferRoute from "./routes/transfer.js";
import budgetRoute from "./routes/budget.js";
import { errorMiddleware } from "./middlewares/error.js";
import { authentication } from "./middlewares/auth.js";
import fs from "fs";
import { specs, swaggerUi } from "./swagger/swagger.js";
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/v1/users", userRoute);

app.use("/api/v1/bank", authentication, bankRoute);
app.use("/api/v1/wallet", authentication, walletRoute);
app.use("/api/v1/income", authentication, incomeRoute);
app.use("/api/v1/expense", authentication, expenseRoute);
app.use("/api/v1/transfer", authentication, transferRoute);
app.use("/api/v1/budget", authentication, budgetRoute);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
