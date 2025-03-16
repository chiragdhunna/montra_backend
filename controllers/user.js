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
        await generatePDF(results, filepath, res, dataType, req);
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

const generatePDF = async (data, filepath, res, dataType, req) => {
  console.log("generatePDF called with arguments:", {
    dataType,
    filepath,
    hasData: Array.isArray(data) && data.length > 0,
    hasReq: !!req,
    hasUser: req ? !!req.user : false,
  });

  if (!req) {
    console.error("Error: req is undefined in generatePDF function");
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Request object is missing",
    });
  }

  const fullFilepath = path.join(process.cwd(), filepath);

  if (!fs.existsSync(path.dirname(fullFilepath))) {
    fs.mkdirSync(path.dirname(fullFilepath), { recursive: true });
  }

  // Retrieve user from authentication middleware
  const user = req.user || { name: "chirag", email: "chirag@gmail.com" };

  const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
  const writeStream = fs.createWriteStream(`${fullFilepath}.pdf`);
  doc.pipe(writeStream);

  // Cover Page - Title
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Comprehensive Financial Report", { align: "center" });
  doc.moveDown(2);

  // User Information
  doc.fontSize(14).font("Helvetica-Bold").text("User Information");
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica").text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Report Type: Full Financial Report`);
  doc.text(`Date Range: January 1, 2025 - March 31, 2025`);
  doc.text(`Generated On: 2025-03-16`);
  doc.moveDown(2);

  // Financial Summary
  doc.fontSize(14).font("Helvetica-Bold").text("Financial Summary");
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica").text(`Total Income: $50,000`);
  doc.text(`Total Expenses: $35,000`);
  doc.text(`Net Balance: $15,000`);
  doc.text(`Total Transfers: $7,200`);
  doc.text(`Total Budgets: $20,000`);
  doc.moveDown(2);

  // Budgets Overview - Table format
  doc.fontSize(14).font("Helvetica-Bold").text("Budgets Overview");
  doc.moveDown(0.5);

  // Budgets table
  const budgetHeaders = [
    "Budget Name",
    "Total Budget",
    "Current Spent",
    "Remaining",
  ];
  const budgetRows = [
    ["Monthly Expenses", "$5,000", "$3,000", "$2,000"],
    ["Vacation Fund", "$3,000", "$500", "$2,500"],
    ["Emergency Savings", "$10,000", "$1,200", "$8,800"],
  ];

  createTable(doc, budgetHeaders, budgetRows);
  doc.moveDown(1);

  // Income Details - Table format with right-aligned title
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Income Details", { align: "left" });
  doc.moveDown(0.5);

  const incomeHeaders = ["Date", "Amount", "Source", "Description"];
  const incomeRows = [
    ["01-01-2025", "$3,000", "Bank", "Salary"],
    ["15-02-2025", "$2,000", "Wallet", "Freelance"],
    ["10-03-2025", "$5,000", "Bank", "Bonus"],
    ["20-03-2025", "$4,000", "Cash", "Consulting"],
  ];

  createTable(doc, incomeHeaders, incomeRows);
  doc.moveDown(1);

  // Add a new page for the rest of the content
  doc.addPage();

  // Expense Details - Table format
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Expense Details", { align: "left" });
  doc.moveDown(0.5);

  const expenseHeaders = ["Date", "Amount", "Source", "Description"];
  const expenseRows = [
    ["05-01-2025", "$1,500", "Credit Card", "Groceries"],
    ["10-02-2025", "$2,000", "Bank", "Rent"],
    ["15-02-2025", "$1,200", "Cash", "Shopping"],
    ["20-03-2025", "$800", "Wallet", "Dining"],
  ];

  createTable(doc, expenseHeaders, expenseRows);
  doc.moveDown(1);

  // Transfer Details - Table format
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Transfer Details", { align: "left" });
  doc.moveDown(0.5);

  const transferHeaders = ["Date", "Amount", "Sender", "Receiver"];
  const transferRows = [
    ["10-02-2025", "$500", "John", "Mike"],
    ["12-02-2025", "$700", "Wallet", "Bank"],
    ["18-03-2025", "$1,000", "Bank", "Savings"],
  ];

  createTable(doc, transferHeaders, transferRows);
  doc.moveDown(1);

  // Wallet Overview - Table format
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Wallet Overview", { align: "left" });
  doc.moveDown(0.5);

  const walletHeaders = ["Wallet Name", "Amount", "Wallet Number"];
  const walletRows = [
    ["Main Wallet", "$2,500", "XYZ-123-456"],
    ["Savings Wallet", "$4,000", "DEF-789-654"],
  ];

  createTable(doc, walletHeaders, walletRows);
  doc.moveDown(1);

  // Bank Overview - Table format
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Bank Overview", { align: "left" });
  doc.moveDown(0.5);

  const bankHeaders = ["Bank Name", "Amount", "Account Number"];
  const bankRows = [
    ["Chase", "$5,000", "ABC-987-654"],
    ["Bank of America", "$10,000", "XYZ-321-654"],
  ];

  createTable(doc, bankHeaders, bankRows);

  doc.end();

  writeStream.on("finish", () => {
    res.download(
      `${fullFilepath}.pdf`,
      `${dataType}_export_${Date.now()}.pdf`,
      (err) => {
        if (err) {
          console.error("Download error:", err);
          fs.unlinkSync(`${fullFilepath}.pdf`);
        }
      }
    );
  });
};

// Helper function to create tables with grid lines
function createTable(doc, headers, rows) {
  const colCount = headers.length;
  const tableWidth = 500;
  const colWidth = tableWidth / colCount;
  const startX = 50;
  let y = doc.y;
  const rowHeight = 30; // Increased row height for multi-line content

  // Draw table headers with borders
  doc.font("Helvetica-Bold");

  // Draw header row border
  doc.rect(startX, y, tableWidth, rowHeight).stroke();

  // Draw header column separators
  for (let i = 1; i < colCount; i++) {
    doc
      .moveTo(startX + i * colWidth, y)
      .lineTo(startX + i * colWidth, y + rowHeight)
      .stroke();
  }

  // Draw header text
  headers.forEach((header, i) => {
    doc.text(header, startX + i * colWidth + 5, y + 10, {
      width: colWidth - 10,
      align: "left",
    });
  });

  // Move to next row
  y += rowHeight;

  // Switch to normal font for data rows
  doc.font("Helvetica");

  // Draw data rows
  rows.forEach((row, rowIndex) => {
    // Check if this row contains "Emergency Savings" - special case
    const isEmergencySavings = row.some((cell) => cell === "Emergency Savings");
    const currentRowHeight = isEmergencySavings ? rowHeight * 1.2 : rowHeight;

    // Draw row border
    doc.rect(startX, y, tableWidth, currentRowHeight).stroke();

    // Draw column separators
    for (let i = 1; i < colCount; i++) {
      doc
        .moveTo(startX + i * colWidth, y)
        .lineTo(startX + i * colWidth, y + currentRowHeight)
        .stroke();
    }

    // Draw cell text
    row.forEach((cell, colIndex) => {
      // Special handling for multi-line text like "Emergency Savings"
      if (cell === "Emergency Savings") {
        const words = cell.split(" ");
        const lineHeight = 12; // Space between lines
        doc.text(words[0], startX + colIndex * colWidth + 5, y + 5);
        doc.text(
          words[1],
          startX + colIndex * colWidth + 5,
          y + 5 + lineHeight
        );
      } else {
        doc.text(cell, startX + colIndex * colWidth + 5, y + 10, {
          width: colWidth - 10,
          align: "left",
        });
      }
    });

    // Move to next row
    y += currentRowHeight;
  });

  // Update doc.y position after the table
  doc.y = y + 5;
}
export { signup, login, imageUpload, logout, exportData, getImage };
