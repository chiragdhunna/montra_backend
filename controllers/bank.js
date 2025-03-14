import { query } from "express";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";

const createBankAccount = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const deleteBankAccount = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const updateBankAccount = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const getAllBankAccounts = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

export {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
  getAllBankAccounts,
};
