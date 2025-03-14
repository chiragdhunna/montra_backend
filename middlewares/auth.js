import jwt from "jsonwebtoken";
import connection from "../database/db.js";
import { TryCatch } from "./error.js";
import { ErrorHandler } from "../utils/utility.js";

const authentication = TryCatch((req, res, next) => {
  const { token } = req.headers;
  console.log(`Auth Token : ${token}`);

  const { userId } = jwt.decode(token);

  const query = `select * from user where user_id = ?`;

  connection.query(query, [userId], (err, result) => {
    if (err) return new ErrorHandler("User Does not exist", 404);

    req.user = result[0];

    next();
  });
});

export { authentication };
