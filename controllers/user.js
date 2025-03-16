import connection from "../database/db.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import csv from "csv-writer";
import fs from "fs";
import path from "path";

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

const logout = TryCatch((req, res, next) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

const exportData = TryCatch(async (req, res, next) => {
  // Create exports directory if it doesn't exist
  const exportsDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const { dataType = "all", dateRange = "30days", format = "csv" } = req.body;

  const user = req.user;
  if (!user) return next(new ErrorHandler("User not authenticated", 401));

  // Determine date range
  let dateQuery = "";
  const currentDate = new Date();
  switch (dateRange) {
    case "lastYear":
      currentDate.setFullYear(currentDate.getFullYear() - 1);
      break;
    case "lastQuarter":
      currentDate.setMonth(currentDate.getMonth() - 3);
      break;
    case "6months":
      currentDate.setMonth(currentDate.getMonth() - 6);
      break;
    case "1month":
    default:
      currentDate.setMonth(currentDate.getMonth() - 1);
      break;
  }

  dateQuery = `AND created_at >= '${currentDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")}'`;

  // Prepare data queries based on dataType
  const queries = {
    expense: `SELECT * FROM expense WHERE user_id = ? ${dateQuery}`,
    income: `SELECT * FROM income WHERE user_id = ? ${dateQuery}`,
    transfer: `SELECT * FROM transfer WHERE user_id = ? ${dateQuery}`,
    budget: `SELECT * FROM budget WHERE user_id = ? ${dateQuery}`,
    all: `
    (SELECT 'expense' as type, 
      e.expense_id as id, 
      e.user_id, 
      e.amount, 
      e.source,
      e.attachment,
      e.description, 
      e.created_at,
      NULL as sender,
      NULL as receiver,
      NULL as is_expense,
      NULL as name,
      NULL as total_budget,
      NULL as current
     FROM expense e WHERE e.user_id = ? ${dateQuery})
    UNION ALL
    (SELECT 'income' as type, 
      i.income_id as id, 
      i.user_id, 
      i.amount, 
      i.source,
      i.attachment,
      i.description, 
      i.created_at,
      NULL as sender,
      NULL as receiver,
      NULL as is_expense,
      NULL as name,
      NULL as total_budget,
      NULL as current
     FROM income i WHERE i.user_id = ? ${dateQuery})
    UNION ALL
    (SELECT 'transfer' as type, 
      t.transfer_id as id, 
      t.user_id, 
      t.amount, 
      NULL as source,
      NULL as attachment,
      NULL as description, 
      t.created_at,
      t.sender,
      t.receiver,
      t.is_expense,
      NULL as name,
      NULL as total_budget,
      NULL as current
     FROM transfer t WHERE t.user_id = ? ${dateQuery})
    UNION ALL
    (SELECT 'budget' as type, 
      b.budget_id as id, 
      b.user_id, 
      NULL as amount, 
      NULL as source,
      NULL as attachment,
      NULL as description, 
      b.created_at,
      NULL as sender,
      NULL as receiver,
      NULL as is_expense,
      b.name,
      b.total_budget,
      b.current
     FROM budget b WHERE b.user_id = ? ${dateQuery})
  `,
  };

  // Execute query
  const query = queries[dataType] || queries.all;
  const queryParams =
    dataType === "all"
      ? [user.user_id, user.user_id, user.user_id, user.user_id]
      : [user.user_id];

  connection.query(query, queryParams, async (err, results) => {
    if (err) {
      console.error("Export query error:", err);
      return next(new ErrorHandler("Error fetching data", 500));
    }

    // Check if results are empty
    if (!results || results.length === 0) {
      return next(new ErrorHandler("No data available for export", 404));
    }

    // Generate file based on format
    const timestamp = Date.now();
    const filename = `${dataType}_export_${timestamp}`;
    const filepath = path.join("exports", filename);

    try {
      if (format === "csv") {
        await generateCSV(results, filepath, res, dataType);
      } else if (format === "pdf") {
        await generatePDF(results, filepath, res, dataType);
      } else {
        return next(new ErrorHandler("Invalid export format", 400));
      }
    } catch (exportError) {
      console.error("Export generation error:", exportError);
      return next(new ErrorHandler("Error generating export file", 500));
    }
  });
});

const generateCSV = async (data, filepath, res, dataType) => {
  // Ensure full path is used
  const fullFilepath = path.join(process.cwd(), filepath);

  // Ensure directory exists
  const dir = path.dirname(fullFilepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Determine headers dynamically
  const headers = data[0]
    ? Object.keys(data[0]).map((key) => ({
        id: key,
        title: key.replace(/_/g, " ").toUpperCase(),
      }))
    : [];

  const csvWriter = csv.createObjectCsvWriter({
    path: `${fullFilepath}.csv`,
    header: headers,
  });

  await csvWriter.writeRecords(data);

  // Send file for download
  res.download(
    `${fullFilepath}.csv`,
    `${dataType}_export_${Date.now()}.csv`,
    (err) => {
      if (err) {
        console.error("Download error:", err);
        try {
          fs.unlinkSync(`${fullFilepath}.csv`);
        } catch (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
        }
      }
    }
  );
};

const generatePDF = async (data, filepath, res, dataType) => {
  // Ensure full path is used
  const fullFilepath = path.join(process.cwd(), filepath);

  // Ensure directory exists
  const dir = path.dirname(fullFilepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(`${fullFilepath}.pdf`);

  doc.pipe(writeStream);

  // PDF styling and content
  doc
    .fontSize(12)
    .text(`${dataType.toUpperCase()} Export Report`, { align: "center" })
    .moveDown();

  // Table-like formatting
  doc.fontSize(10);
  const headers = Object.keys(data[0] || {});

  // Print headers
  doc.font("Helvetica-Bold");
  headers.forEach((header, index) => {
    doc.text(header.toUpperCase(), {
      continued: index < headers.length - 1,
    });
  });
  doc.moveDown();

  // Print data
  doc.font("Helvetica");
  data.forEach((item) => {
    headers.forEach((header, index) => {
      doc.text(String(item[header]), {
        continued: index < headers.length - 1,
      });
    });
    doc.moveDown();
  });

  doc.end();

  writeStream.on("finish", () => {
    res.download(
      `${fullFilepath}.pdf`,
      `${dataType}_export_${Date.now()}.pdf`,
      (err) => {
        if (err) {
          console.error("Download error:", err);
          try {
            fs.unlinkSync(`${fullFilepath}.pdf`);
          } catch (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        }
      }
    );
  });
};

export { signup, login, imageUpload, logout, exportData, getImage };
