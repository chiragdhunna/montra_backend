import { incomeSource } from "../constants/income.js";
import connection from "../database/db.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const addIncome = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { amount, source, description } = req.body;

  const isValidSourceName = (name) => incomeSource.includes(name);

  if (!isValidSourceName(source)) {
    console.error(source);
    return next(new ErrorHandler("Invalid income source", 400));
  }

  // check whether req.file contians the file
  // if not multer is failed to parse so notify the client
  if (!req.file) {
    // console.error({ req });
    res.status(413).send(`File not uploaded!, Please
    					attach jpeg file under 5 MB`);
    // res.json(JSON.parse(req));
    return;
  }

  const attachment = req.file.path;

  const query = `insert into income (amount, source, attachment, description user_id) values (?,?,?,?,?)`;

  const results = await connection
    .promise()
    .query(query, [amount, source, attachment, description, user.user_id]);

  res.send({ results });
});

const updateIncome = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { incomeId, amount, source, description } = req.body;

  const query = `update income set amount = ?, source = ?,  description = ? where income_id = ? and user_id = ?`;

  const results = await connection
    .promise()
    .query(query, [amount, source, description, incomeId, user.user_id]);

  res.send(results[0]);
});

const deleteIncome = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const { incomeId } = req.body;

  const query = `delete from income where income_id = ? and user_id = ?`;

  const results = await connection
    .promise()
    .query(query, [incomeId, user.user_id]);

  if (results[0].affectedRows === 0) {
    return next(new ErrorHandler("DB not update", 500));
  }

  res.send(results[0]);
});

const getIncome = TryCatch(async (req, res, next, err) => {
  const user = req.user;

  const query = `select SUM(amount) as income from income where user_id = ?`;

  const results = await connection.promise().query(query, [user.user_id]);

  res.send(results[0]);
});

export { addIncome, updateIncome, deleteIncome, getIncome };
