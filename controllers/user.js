import connection from "../database/db.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import bcrypt from "bcrypt";

const signup = TryCatch(async (req, res, next) => {
  const { name, email, password, imgUrl, pin } = req.body;

  const saltRounds = 10;
  var ecryptedPassword = await bcrypt.hash(password, saltRounds);

  const query = `INSERT INTO user (name, email, password, img_url, pin) VALUES (?, ?, ?, ?, ?)`;

  connection.query(
    query,
    [name, email, ecryptedPassword, imgUrl, pin],
    (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return next(new ErrorHandler("Database error", 500));
      } else {
        const emailQuery = "SELECT * FROM user WHERE email = ?";
        connection.query(emailQuery, [email], (err, result) => {
          if (err) {
            return next(new ErrorHandler("Database error", 500));
          }

          const user = result[0];
          const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            process.env.JWT_SECRET
          );
          res
            .status(201)
            .json({ success: true, userId: result.insertId, token });
        });
      }
    }
  );
});

const login = TryCatch((req, res, next) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM user WHERE email = ?";

  connection.query(query, [email], (err, results) => {
    if (err) return next(new ErrorHandler("Database error", 500));

    if (results.length === 0)
      return next(new ErrorHandler("Invalid credentials", 401));

    const user = results[0];

    bcrypt.compare(password, user.password, (err, hash) => {
      if (err || !hash)
        return next(new ErrorHandler("Incorrect Password", 401));

      console.log({
        password: password,
        hash: hash,
      });

      // ✅ Generate JWT
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET
      );

      res.json({ success: true, token });
    });
  });
});

const imageUpload = TryCatch((req, res, next) => {
  // check whether req.file contians the file
  // if not multer is failed to parse so notify the client
  if (!req.file) {
    // console.error({ req });
    res.status(413).send(`File not uploaded!, Please
    					attach jpeg file under 5 MB`);
    // res.json(JSON.parse(req));
    return;
  }

  const user = req.user;

  if (!user)
    return new ErrorHandler("User not authorized to upload image", 401);

  const query = `update user set img_url = ? where user_id = ?`;

  connection.query(query, [req.file.path, user.user_id], (err, result) => {
    if (err) return new ErrorHandler("Cannot add img_url");

    // successfull completion
    res.status(201).send(`Files uploaded successfully : ${req.file.path}`);
  });
});

const getImage = TryCatch((req, res, err) => {
  const filename = req.query.filename;

  const user = req.user;

  const query = `select img_url from user where user_id = ?`;

  connection.query(query, [user.user_id], (err, result) => {
    if (err) return new ErrorHandler("Image not found", 404);

    res.sendFile(result[0].img_url);
  });
});

const logout = TryCatch((req, res, next) => {});

const exportData = TryCatch((req, res, next) => {
  // Format of the Report
  // 1. PDF
  // 2. CSV
  // Data to Export :
  // 1. All
  // 2. Expense Report
  // 3. Income Report
  // 4. Transfer Report
  // Date Range
  // 1. 30 days
  // 2. 3 Months
  // 3. 6 Months
  // 4. Last Year
});

export { signup, login, imageUpload, logout, exportData, getImage };
