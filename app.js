import "dotenv/config";

import express from "express";
import connection from "./database/db.js";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  connection.query("show databases", (err, results) => {
    if (err) {
      res.send("Error : " + err);
    } else {
      res.json({ databases: results });
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
