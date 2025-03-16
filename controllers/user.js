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
        "Error: ", err;
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
    //({ req });
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

  if (!user) {
    `user : ${user}`;
    return next(new ErrorHandler("User not authenticated", 401));
  }
  console.log(`user : ${user}`);

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
      "Export query error:", err;
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
      "Export generation error:", exportError;
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
        "Download error:", err;
        try {
          fs.unlinkSync(`${fullFilepath}.csv`);
        } catch (unlinkErr) {
          "Error deleting file:", unlinkErr;
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
    ("Error: req is undefined in generatePDF function");
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Request object is missing",
    });
  }

  const fullFilepath = path.join(process.cwd(), filepath);

  if (!fs.existsSync(path.dirname(fullFilepath))) {
    fs.mkdirSync(path.dirname(fullFilepath), { recursive: true });
  }

  // Get the user ID from the request
  const userId = req.user ? req.user.user_id : null;
  console.log(`userId : ${userId}`);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  // Fetch all necessary data from the database
  try {
    // First, fetch user information
    const userQuery = "SELECT name, email FROM user WHERE user_id = ?";
    const userResult = await queryDatabase(userQuery, [userId]);
    const user = userResult[0] || { name: "User", email: "user@example.com" };

    // Fetch summary data
    const incomeQuery =
      "SELECT SUM(amount) as totalIncome FROM income WHERE user_id = ?";
    const incomeResult = await queryDatabase(incomeQuery, [userId]);
    const totalIncome = incomeResult[0].totalIncome || 0;

    const expenseQuery =
      "SELECT SUM(amount) as totalExpense FROM expense WHERE user_id = ?";
    const expenseResult = await queryDatabase(expenseQuery, [userId]);
    const totalExpense = expenseResult[0].totalExpense || 0;

    const transferQuery =
      "SELECT SUM(amount) as totalTransfer FROM transfer WHERE user_id = ?";
    const transferResult = await queryDatabase(transferQuery, [userId]);
    const totalTransfer = transferResult[0].totalTransfer || 0;

    const budgetQuery =
      "SELECT SUM(total_budget) as totalBudget FROM budget WHERE user_id = ?";
    const budgetResult = await queryDatabase(budgetQuery, [userId]);
    const totalBudget = budgetResult[0].totalBudget || 0;

    // Fetch detailed data
    const budgetsQuery =
      "SELECT name, total_budget, current, (total_budget - current) as remaining FROM budget WHERE user_id = ? ORDER BY created_at DESC LIMIT 10";
    const budgetsResult = await queryDatabase(budgetsQuery, [userId]);

    const incomeDetailsQuery =
      "SELECT DATE_FORMAT(created_at, '%d-%m-%Y') as date, amount, source, description FROM income WHERE user_id = ? ORDER BY created_at DESC LIMIT 10";
    const incomeDetailsResult = await queryDatabase(incomeDetailsQuery, [
      userId,
    ]);

    const expenseDetailsQuery =
      "SELECT DATE_FORMAT(created_at, '%d-%m-%Y') as date, amount, source, description FROM expense WHERE user_id = ? ORDER BY created_at DESC LIMIT 10";
    const expenseDetailsResult = await queryDatabase(expenseDetailsQuery, [
      userId,
    ]);

    const transferDetailsQuery =
      "SELECT DATE_FORMAT(created_at, '%d-%m-%Y') as date, amount, sender, receiver FROM transfer WHERE user_id = ? ORDER BY created_at DESC LIMIT 10";
    const transferDetailsResult = await queryDatabase(transferDetailsQuery, [
      userId,
    ]);

    const walletQuery =
      "SELECT name, amount, wallet_number FROM wallet WHERE user_id = ?";
    const walletResult = await queryDatabase(walletQuery, [userId]);

    const bankQuery =
      "SELECT name, amount, account_number FROM bank WHERE user_id = ?";
    const bankResult = await queryDatabase(bankQuery, [userId]);

    // Now generate the PDF with the actual data
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    });

    const writeStream = fs.createWriteStream(`${fullFilepath}.pdf`);
    doc.pipe(writeStream);

    // Define a consistent starting position for all sections
    const startX = 50;
    const pageWidth = doc.page.width - 100; // Account for margins

    // Cover Page - Title
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Comprehensive Financial Report", { align: "center" });
    doc.moveDown(2);

    // User Information
    doc.fontSize(16).font("Helvetica-Bold").text("User Information", startX);
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").text(`Name: ${user.name}`, startX);
    doc.text(`Email: ${user.email}`, startX);
    doc.text(
      `Report Type: ${
        dataType.charAt(0).toUpperCase() + dataType.slice(1)
      } Financial Report`,
      startX
    );

    // Current date for the report
    const currentDate = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options);
    doc.text(`Generated On: ${formattedDate}`, startX);
    doc.moveDown(2);

    // Financial Summary
    doc.fontSize(16).font("Helvetica-Bold").text("Financial Summary", startX);
    doc.moveDown(0.5);

    // Create a summary table instead of simple text
    const summaryHeaders = ["Metric", "Amount"];
    const summaryRows = [
      ["Total Income", `$${formatMoney(totalIncome)}`],
      ["Total Expenses", `$${formatMoney(totalExpense)}`],
      ["Net Balance", `$${formatMoney(totalIncome - totalExpense)}`],
      ["Total Transfers", `$${formatMoney(totalTransfer)}`],
      ["Total Budgets", `$${formatMoney(totalBudget)}`],
    ];

    createTable(doc, summaryHeaders, summaryRows);
    doc.moveDown(2);

    // Budgets Overview - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Budgets Overview", startX);
    doc.moveDown(0.5);

    // Budgets table
    const budgetHeaders = [
      "Budget Name",
      "Total Budget",
      "Current Spent",
      "Remaining",
    ];
    const budgetRows = budgetsResult.map((budget) => [
      budget.name,
      `$${formatMoney(budget.total_budget)}`,
      `$${formatMoney(budget.current)}`,
      `$${formatMoney(budget.remaining)}`,
    ]);

    createTable(
      doc,
      budgetHeaders,
      budgetRows.length > 0
        ? budgetRows
        : [["No budget data available", "", "", ""]]
    );
    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Income Details - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Income Details", startX);
    doc.moveDown(0.5);

    const incomeHeaders = ["Date", "Amount", "Source", "Description"];
    const incomeRows = incomeDetailsResult.map((income) => [
      income.date,
      `$${formatMoney(income.amount)}`,
      income.source || "N/A",
      income.description || "N/A",
    ]);

    createTable(
      doc,
      incomeHeaders,
      incomeRows.length > 0
        ? incomeRows
        : [["No income data available", "", "", ""]]
    );
    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Expense Details - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Expense Details", startX);
    doc.moveDown(0.5);

    const expenseHeaders = ["Date", "Amount", "Source", "Description"];
    const expenseRows = expenseDetailsResult.map((expense) => [
      expense.date,
      `$${formatMoney(expense.amount)}`,
      expense.source || "N/A",
      expense.description || "N/A",
    ]);

    createTable(
      doc,
      expenseHeaders,
      expenseRows.length > 0
        ? expenseRows
        : [["No expense data available", "", "", ""]]
    );
    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Transfer Details - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Transfer Details", startX);
    doc.moveDown(0.5);

    const transferHeaders = ["Date", "Amount", "Sender", "Receiver"];
    const transferRows = transferDetailsResult.map((transfer) => [
      transfer.date,
      `$${formatMoney(transfer.amount)}`,
      transfer.sender || "N/A",
      transfer.receiver || "N/A",
    ]);

    createTable(
      doc,
      transferHeaders,
      transferRows.length > 0
        ? transferRows
        : [["No transfer data available", "", "", ""]]
    );
    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Wallet Overview - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Wallet Overview", startX);
    doc.moveDown(0.5);

    const walletHeaders = ["Wallet Name", "Amount", "Wallet Number"];
    const walletRows = walletResult.map((wallet) => [
      wallet.name,
      `$${formatMoney(wallet.amount)}`,
      wallet.wallet_number,
    ]);

    createTable(
      doc,
      walletHeaders,
      walletRows.length > 0
        ? walletRows
        : [["No wallet data available", "", ""]]
    );
    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Bank Overview - Table format
    doc.fontSize(16).font("Helvetica-Bold").text("Bank Overview", startX);
    doc.moveDown(0.5);

    const bankHeaders = ["Bank Name", "Amount", "Account Number"];
    const bankRows = bankResult.map((bank) => [
      bank.name,
      `$${formatMoney(bank.amount)}`,
      bank.account_number,
    ]);

    createTable(
      doc,
      bankHeaders,
      bankRows.length > 0 ? bankRows : [["No bank data available", "", ""]]
    );

    // Add page numbers and headers to all pages
    const totalPages = doc.bufferedPageRange().count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      // Add header
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Comprehensive Financial Report", 50, 20, {
          align: "center",
          width: pageWidth,
        });
      doc
        .moveTo(50, 35)
        .lineTo(pageWidth + 50, 35)
        .stroke();

      // Add footer with page number
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Page ${i + 1} of ${totalPages}`, 50, doc.page.height - 30, {
          align: "center",
          width: pageWidth,
        });
    }

    doc.end();

    writeStream.on("finish", () => {
      res.download(
        `${fullFilepath}.pdf`,
        `${dataType}_export_${Date.now()}.pdf`,
        (err) => {
          if (err) {
            "Download error:", err;
            try {
              fs.unlinkSync(`${fullFilepath}.pdf`);
            } catch (unlinkErr) {
              "Error deleting file:", unlinkErr;
            }
          }
        }
      );
    });
  } catch (error) {
    "Error generating PDF:", error;
    return res.status(500).json({
      success: false,
      message: "Error generating PDF report",
    });
  }
};

// Helper function to format money values
function formatMoney(amount) {
  // Handle null or undefined values
  if (amount === null || amount === undefined) {
    return "0.00";
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // Format with commas for thousands and two decimal places
  return numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function addPageElements(doc, pageNumber, totalPages) {
  const pageWidth = doc.page.width - 100; // Account for margins

  // Add header
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Comprehensive Financial Report", 50, 20, {
      align: "center",
      width: pageWidth,
    });
  doc
    .moveTo(50, 35)
    .lineTo(pageWidth + 50, 35)
    .stroke();

  // Add footer with page number
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Page ${pageNumber} of ${totalPages}`, 50, doc.page.height - 30, {
      align: "center",
      width: pageWidth,
    });

  // Reset cursor position for content
  doc.y = 50;

  return doc;
}

function formatDateRange(dateRange) {
  const currentDate = new Date();
  let startDate = new Date();

  switch (dateRange) {
    case "lastYear":
      startDate.setFullYear(currentDate.getFullYear() - 1);
      break;
    case "lastQuarter":
      startDate.setMonth(currentDate.getMonth() - 3);
      break;
    case "6months":
      startDate.setMonth(currentDate.getMonth() - 6);
      break;
    case "1month":
    default:
      startDate.setMonth(currentDate.getMonth() - 1);
      break;
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return {
    startDate: startDate,
    endDate: currentDate,
    formatted: `${formatDate(startDate)} - ${formatDate(currentDate)}`,
  };
}

// Helper function to run database queries with promises
function queryDatabase(query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (err, results) => {
      if (err) {
        "Database query error:", err;
        reject(new Error(`Database query failed: ${err.message}`));
      } else {
        // Handle empty results by returning an empty array instead of null
        resolve(results || []);
      }
    });
  });
}

// Helper function to create tables with grid lines
function createTable(doc, headers, rows) {
  const colCount = headers.length;
  const tableWidth = 500;
  const colWidth = tableWidth / colCount;
  const startX = 50;
  let y = doc.y;
  const rowHeight = 30;

  // Draw table headers with proper alignment and spacing
  doc.font("Helvetica-Bold");

  // Draw header background
  doc
    .rect(startX, y, tableWidth, rowHeight)
    .fillAndStroke("#f0f0f0", "#000000");

  // Draw header text with proper positioning
  headers.forEach((header, i) => {
    doc.fillColor("#000000").text(header, startX + i * colWidth + 5, y + 10, {
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
    // Alternate row colors for better readability
    const fillColor = rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9";

    // Draw row background
    doc
      .rect(startX, y, tableWidth, rowHeight)
      .fillAndStroke(fillColor, "#000000");

    // Draw cell text with proper positioning
    row.forEach((cell, colIndex) => {
      // Determine text alignment based on content type
      let align = "left";
      if (colIndex === 1 && cell && cell.toString().startsWith("$")) {
        align = "right"; // Align currency values to the right
      }

      // Handle potential overflow for longer text
      const cellText = cell || "N/A";
      const cellY = y + 10;
      const cellX = startX + colIndex * colWidth + 5;
      const cellWidth = colWidth - 10;

      doc.fillColor("#000000").text(cellText, cellX, cellY, {
        width: cellWidth,
        align: align,
        lineBreak: true,
        height: rowHeight - 15, // Limit text height to prevent overflow
      });
    });

    // Move to next row
    y += rowHeight;
  });

  // Update doc.y position after the table
  doc.y = y + 10;

  return doc;
}

export { signup, login, imageUpload, logout, exportData, getImage };
