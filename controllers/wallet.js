import { query } from "express";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";

const createWalletAccount = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const deleteWalletAccount = TryCatch((req, res, err, next) => {
  // Account Number to delete
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const updateWalletAccount = TryCatch((req, res, err, next) => {
  // Account Number to update
  const user = req.user;

  query = ``;

  connection.query(query, (err, result) => {});
});

const getAllWalletAccounts = TryCatch((req, res, err, next) => {
  const user = req.user;

  query = `select * form wallet where user_id = ?`;

  connection.query(query, (err, result) => {});
});

export {
  createWalletAccount,
  deleteWalletAccount,
  updateWalletAccount,
  getAllWalletAccounts,
};
