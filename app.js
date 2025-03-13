import "dotenv/config";

import express from "express";
import connection from "./database/db.js";

import userRoute from "./routes/user.js";
import bankRoute from "./routes/bank.js";
import walletRoute from "./routes/wallet.js";
import { errorMiddleware } from "./middlewares/error.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/v1/user", userRoute);
app.use("/api/v1/bank", bankRoute);
app.use("/api/v1/wallet", walletRoute);

app.get("/", (req, res) => {
  connection.query("show databases", (err, results) => {
    if (err) {
      res.send("Error : " + err);
    } else {
      res.json({ databases: results });
    }
  });
});

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
