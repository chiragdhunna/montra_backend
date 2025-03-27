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

  // Updated query with RETURNING clause for PostgreSQL
  const query = `INSERT INTO users (name, email, password, img_url, pin) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email`;

  connection.query(
    query,
    [name, email, ecryptedPassword, imgUrl, pin],
    (err, result) => {
      if (err) {
        console.error("Signup Error: ", err);
        return next(new ErrorHandler("Database error", 500));
      }

      // Get user data from the RETURNING clause
      const user = result && result[0] ? result[0] : null;

      if (!user) {
        return next(new ErrorHandler("Failed to create user", 500));
      }

      // Create user response object without password
      const userResponse = {
        user_id: user.user_id.toString(),
        name: user.name,
        email: user.email,
      };

      // Create token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET
      );

      // Return the same response format as login
      res.status(201).json({
        user: userResponse,
        token,
      });
    }
  );
});

const login = TryCatch((req, res, next) => {
  const { email, password } = req.body;

  const query =
    "SELECT user_id, name, email, password FROM users WHERE email = $1";

  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return next(new ErrorHandler("Database error", 500));
    }

    if (!results || results.length === 0) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return next(new ErrorHandler("Incorrect Password", 401));
      }

      // Remove password from user object before sending
      const userResponse = {
        user_id: user.user_id.toString(),
        name: user.name,
        email: user.email,
      };

      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET
      );

      res.json({
        user: userResponse,
        token,
      });
    });
  });
});

const getMe = TryCatch((req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new ErrorHandler("User not authorized", 401));
  }

  // Updated query for PostgreSQL
  const query = `SELECT user_id, name, email, img_url FROM users WHERE user_id = $1`;

  connection.query(query, [user.user_id], (err, result) => {
    if (err) {
      console.error("Get user error:", err);
      return next(new ErrorHandler("User not found", 404));
    }

    if (!result || result.length === 0) {
      return next(new ErrorHandler("User not found", 404));
    }

    const { user_id: userId, email } = req.user;

    const token = jwt.sign(
      { userId: userId, email: email },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      user: result[0],
      token,
    });
  });
});

const imageUpload = TryCatch((req, res, next) => {
  // Check whether req.file contains the file
  if (!req.file) {
    res
      .status(413)
      .send(`File not uploaded! Please attach jpeg file under 5 MB`);
    return;
  }

  const user = req.user;

  if (!user) {
    return next(new ErrorHandler("User not authorized to upload image", 401));
  }

  // Updated query for PostgreSQL
  const query = `UPDATE users SET img_url = $1 WHERE user_id = $2`;

  connection.query(query, [req.file.path, user.user_id], (err, result) => {
    if (err) {
      console.error("Image upload error:", err);
      return next(new ErrorHandler("Cannot add img_url", 500));
    }

    // Successful completion
    res.status(201).json({
      img_path: req.file.path,
    });
  });
});

const getImage = TryCatch((req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new ErrorHandler("User not authorized", 401));
  }

  // Updated query for PostgreSQL
  const query = `SELECT img_url FROM users WHERE user_id = $1`;

  connection.query(query, [user.user_id], (err, result) => {
    if (err) {
      console.error("Get image error:", err);
      return next(new ErrorHandler("Image not found", 404));
    }

    if (!result || result.length === 0 || !result[0].img_url) {
      return next(new ErrorHandler("Image not found", 404));
    }

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
    console.error(`user : ${user}`);
    return next(new ErrorHandler("User not authenticated", 401));
  }

  // Determine date range
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

  // PostgreSQL uses different date formatting and parameter style
  const formattedDate = currentDate.toISOString();
  let dateQuery = "AND created_at >= $2";

  // Prepare data queries based on dataType
  const queries = {
    income: `
    SELECT 
      'income' as type, 
      i.income_id::text as id, 
      i.user_id::text, 
      i.amount::text, 
      i.source,
      i.attachment,
      i.description, 
      i.created_at::text
    FROM income i 
    WHERE i.user_id = $1 AND i.created_at >= $2
  `,
    expense: `
    SELECT 
      'expense' as type, 
      e.expense_id::text as id, 
      e.user_id::text, 
      e.amount::text, 
      e.source,
      e.attachment,
      e.description, 
      e.created_at::text
    FROM expense e 
    WHERE e.user_id = $1 AND e.created_at >= $2
  `,
    transfer: `
    SELECT 
      'transfer' as type, 
      t.transfer_id::text as id, 
      t.user_id::text, 
      t.amount::text, 
      t.sender,
      t.receiver,
      t.created_at::text
    FROM transfer t 
    WHERE t.user_id = $1 AND t.created_at >= $2
  `,
    budget: `
    SELECT 
      'budget' as type, 
      b.budget_id::text as id, 
      b.user_id::text, 
      b.name,
      b.total_budget::text,
      b.current::text,
      b.created_at::text
    FROM budget b 
    WHERE b.user_id = $1 AND b.created_at >= $2
  `,
    all: `
      WITH expense_data AS (
        SELECT 
          'expense' as type, 
          e.expense_id::text as id, 
          e.user_id::text, 
          e.amount::text, 
          e.source,
          e.attachment,
          e.description, 
          e.created_at::text,
          NULL::text as sender,
          NULL::text as receiver,
          'false'::text as is_expense,
          NULL::text as name,
          NULL::text as total_budget,
          NULL::text as current
        FROM expense e 
        WHERE e.user_id = $1 AND e.created_at >= $2
      ),
      income_data AS (
        SELECT 
          'income' as type, 
          i.income_id::text as id, 
          i.user_id::text, 
          i.amount::text, 
          i.source,
          i.attachment,
          i.description, 
          i.created_at::text,
          NULL::text as sender,
          NULL::text as receiver,
          'false'::text as is_expense,
          NULL::text as name,
          NULL::text as total_budget,
          NULL::text as current
        FROM income i 
        WHERE i.user_id = $1 AND i.created_at >= $2
      ),
      transfer_data AS (
        SELECT 
          'transfer' as type, 
          t.transfer_id::text as id, 
          t.user_id::text, 
          t.amount::text, 
          NULL::text as source,
          NULL::text as attachment,
          NULL::text as description, 
          t.created_at::text,
          t.sender,
          t.receiver,
          t.is_expense::text,
          NULL::text as name,
          NULL::text as total_budget,
          NULL::text as current
        FROM transfer t 
        WHERE t.user_id = $1 AND t.created_at >= $2
      ),
      budget_data AS (
        SELECT 
          'budget' as type, 
          b.budget_id::text as id, 
          b.user_id::text, 
          NULL::text as amount, 
          NULL::text as source,
          NULL::text as attachment,
          NULL::text as description, 
          b.created_at::text,
          NULL::text as sender,
          NULL::text as receiver,
          NULL::text as is_expense,
          b.name,
          b.total_budget::text,
          b.current::text
        FROM budget b 
        WHERE b.user_id = $1 AND b.created_at >= $2
      )
      SELECT * FROM expense_data
      UNION ALL
      SELECT * FROM income_data
      UNION ALL
      SELECT * FROM transfer_data
      UNION ALL
      SELECT * FROM budget_data
    `,
  };

  // Execute query with PostgreSQL parameters
  const query = queries[dataType] || queries.all;
  let queryParams;

  if (dataType === "all") {
    // For the "all" query, we only need one copy of each parameter
    // since we're using the same parameter numbers ($1 and $2) throughout
    queryParams = [user.user_id, formattedDate];
  } else {
    queryParams = [user.user_id, formattedDate];
  }

  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(query, queryParams, (err, results) => {
        if (err) {
          console.error("Export query error:", err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Check if results are empty
    if (!result || result.length === 0) {
      return next(new ErrorHandler("No data available for export", 404));
    }

    // Generate file based on format
    const timestamp = Date.now();
    const filename = `${dataType}_export_${timestamp}`;
    const filepath = path.join("exports", filename);

    try {
      if (format === "csv") {
        await generateCSV(result, filepath, res, dataType);
      } else if (format === "pdf") {
        await generatePDF(result, filepath, res, dataType, req);
      } else {
        return next(new ErrorHandler("Invalid export format", 400));
      }
    } catch (exportError) {
      console.error("Export generation error:", exportError);
      return next(new ErrorHandler("Error generating export file", 500));
    }
  } catch (err) {
    console.error("Export query error:", err);
    return next(new ErrorHandler("Error fetching data", 500));
  }
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
  // For PostgreSQL, column names are typically lowercase unless quoted in the query
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
  console.log("Data for generatePDF", data.length);

  if (!req || !req.user) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  const userId = req.user.user_id;
  const fullFilepath = path.join(process.cwd(), filepath);

  if (!fs.existsSync(path.dirname(fullFilepath))) {
    fs.mkdirSync(path.dirname(fullFilepath), { recursive: true });
  }

  try {
    // Fetch user info
    const userQuery = "SELECT name, email FROM users WHERE user_id = $1";
    const userResult = await queryDatabase(userQuery, [userId]);
    const user = userResult[0] || { name: "User", email: "user@example.com" };

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    });

    const writeStream = fs.createWriteStream(`${fullFilepath}.pdf`);
    doc.pipe(writeStream);

    const startX = 50;
    const pageWidth = doc.page.width - 100;

    // Title and User Info
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Comprehensive Financial Report", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).font("Helvetica-Bold").text("User Information", startX);
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Name: ${user.name}`, startX)
      .text(`Email: ${user.email}`, startX)
      .text(
        `Report Type: ${
          dataType.charAt(0).toUpperCase() + dataType.slice(1)
        } Financial Report`,
        startX
      );

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated On: ${formattedDate}`, startX);
    doc.moveDown(2);

    // Section Rendering Based on Data Type
    const renderTable = (title, headers, rows, emptyMsg) => {
      if (doc.y > doc.page.height - 200) doc.addPage();
      doc.fontSize(16).font("Helvetica-Bold").text(title, startX);
      doc.moveDown(0.5);
      createTable(
        doc,
        headers,
        rows.length > 0
          ? rows
          : [[emptyMsg, ...Array(headers.length - 1).fill("")]]
      );
      doc.moveDown(2);
    };

    if (dataType === "income") {
      const incomeHeaders = ["Date", "Amount", "Source", "Description"];
      const incomeRows = data.map((row) => [
        row.created_at,
        `$${formatMoney(row.amount)}`,
        row.source || "N/A",
        row.description || "N/A",
      ]);
      renderTable(
        "Income Details",
        incomeHeaders,
        incomeRows,
        "No income data available"
      );
    }

    if (dataType === "expense") {
      const expenseHeaders = ["Date", "Amount", "Source", "Description"];
      const expenseRows = data.map((row) => [
        row.created_at,
        `$${formatMoney(row.amount)}`,
        row.source || "N/A",
        row.description || "N/A",
      ]);
      renderTable(
        "Expense Details",
        expenseHeaders,
        expenseRows,
        "No expense data available"
      );
    }

    if (dataType === "transfer") {
      const transferHeaders = ["Date", "Amount", "Sender", "Receiver"];
      const transferRows = data.map((row) => [
        row.created_at,
        `$${formatMoney(row.amount)}`,
        row.sender || "N/A",
        row.receiver || "N/A",
      ]);
      renderTable(
        "Transfer Details",
        transferHeaders,
        transferRows,
        "No transfer data available"
      );
    }

    if (dataType === "budget") {
      const budgetHeaders = [
        "Budget Name",
        "Total Budget",
        "Current Spent",
        "Remaining",
      ];
      const budgetRows = data.map((row) => [
        row.name,
        `$${formatMoney(row.total_budget)}`,
        `$${formatMoney(row.current)}`,
        `$${formatMoney(row.total_budget - row.current)}`,
      ]);
      renderTable(
        "Budgets Overview",
        budgetHeaders,
        budgetRows,
        "No budget data available"
      );
    }

    if (dataType === "all") {
      const sections = {
        income: {
          title: "Income Details",
          headers: ["Date", "Amount", "Source", "Description"],
          rows: data
            .filter((d) => d.type === "income")
            .map((row) => [
              row.created_at,
              `$${formatMoney(row.amount)}`,
              row.source || "N/A",
              row.description || "N/A",
            ]),
        },
        expense: {
          title: "Expense Details",
          headers: ["Date", "Amount", "Source", "Description"],
          rows: data
            .filter((d) => d.type === "expense")
            .map((row) => [
              row.created_at,
              `$${formatMoney(row.amount)}`,
              row.source || "N/A",
              row.description || "N/A",
            ]),
        },
        transfer: {
          title: "Transfer Details",
          headers: ["Date", "Amount", "Sender", "Receiver"],
          rows: data
            .filter((d) => d.type === "transfer")
            .map((row) => [
              row.created_at,
              `$${formatMoney(row.amount)}`,
              row.sender || "N/A",
              row.receiver || "N/A",
            ]),
        },
        budget: {
          title: "Budgets Overview",
          headers: [
            "Budget Name",
            "Total Budget",
            "Current Spent",
            "Remaining",
          ],
          rows: data
            .filter((d) => d.type === "budget")
            .map((row) => [
              row.name,
              `$${formatMoney(row.total_budget)}`,
              `$${formatMoney(row.current)}`,
              `$${formatMoney(row.total_budget - row.current)}`,
            ]),
        },
      };

      for (const section of Object.values(sections)) {
        renderTable(
          section.title,
          section.headers,
          section.rows,
          `No ${section.title.toLowerCase()} data available`
        );
      }
    }

    // Add page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
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
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating PDF report",
    });
  }
};

// Helper function to format money values
function formatMoney(amount) {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00";
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // Handle NaN after conversion
  if (isNaN(numAmount)) {
    return "0.00";
  }

  // Format with commas for thousands and two decimal places
  return numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function addPageElements(
  doc,
  pageNumber,
  totalPages,
  reportTitle = "Comprehensive Financial Report"
) {
  const pageWidth = doc.page.width - 100; // Account for margins
  const headerY = 20;
  const footerY = doc.page.height - 30;
  const headerLineY = 35;
  const contentStartY = 50;

  // Add header with configurable title
  doc
    .fontSize(10)
    .font("Helvetica-Bold") // Use bold font for header
    .text(reportTitle, 50, headerY, {
      align: "center",
      width: pageWidth,
    });

  // Add divider line
  doc
    .moveTo(50, headerLineY)
    .lineTo(pageWidth + 50, headerLineY)
    .stroke();

  // Add footer with page number
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Page ${pageNumber} of ${totalPages}`, 50, footerY, {
      align: "center",
      width: pageWidth,
    });

  // Reset cursor position for content
  doc.y = contentStartY;

  return doc;
}

function formatDateRange(dateRange) {
  const currentDate = new Date();
  let startDate = new Date();

  // Handle various date range options
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
    case "ytd": // Year to date
      startDate = new Date(currentDate.getFullYear(), 0, 1); // January 1st of current year
      break;
    case "1month":
    default:
      startDate.setMonth(currentDate.getMonth() - 1);
      break;
  }

  // Format date as Month Day, Year
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Return object with raw dates and formatted string
  return {
    startDate: startDate,
    endDate: currentDate,
    formatted: `${formatDate(startDate)} - ${formatDate(currentDate)}`,
  };
}

/**
 * Executes a database query and returns a promise
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Promise resolving to query results
 */
function queryDatabase(query, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (err, results, fields) => {
      if (err) {
        console.error("Database query error:", err);
        reject(new Error(`Database query failed: ${err.message}`));
      } else {
        // Handle empty results by returning an empty array instead of null
        resolve(results || []);
      }
    });
  });
}

function createTable(doc, headers, rows, options = {}) {
  const defaults = {
    tableWidth: 500,
    startX: 50,
    rowHeight: 30,
    headerBgColor: "#f0f0f0",
    evenRowBgColor: "#ffffff",
    oddRowBgColor: "#f9f9f9",
    borderColor: "#000000",
    textColor: "#000000",
    headerFont: "Helvetica-Bold",
    bodyFont: "Helvetica",
    fontSize: 10,
    marginBottom: 30,
  };

  const config = { ...defaults, ...options };
  const colCount = headers.length;
  const colWidth = config.tableWidth / colCount;
  let y = doc.y;

  const renderHeader = () => {
    doc
      .font(config.headerFont)
      .fontSize(config.fontSize)
      .fillColor(config.textColor)
      .rect(config.startX, y, config.tableWidth, config.rowHeight)
      .fillAndStroke(config.headerBgColor, config.borderColor);

    headers.forEach((header, i) => {
      doc.text(
        header,
        config.startX + i * colWidth + 5,
        y + config.rowHeight / 3,
        { width: colWidth - 10, align: "left" }
      );
    });

    y += config.rowHeight;
    doc.y = y;
  };

  const addNewPageIfNeeded = () => {
    if (y + config.rowHeight > doc.page.height - config.marginBottom) {
      doc.addPage();
      y = config.startX;
      renderHeader();
    }
  };

  // Render header first
  renderHeader();
  doc.font(config.bodyFont);

  rows.forEach((row, rowIndex) => {
    addNewPageIfNeeded();

    const fillColor =
      rowIndex % 2 === 0 ? config.evenRowBgColor : config.oddRowBgColor;

    doc
      .rect(config.startX, y, config.tableWidth, config.rowHeight)
      .fillAndStroke(fillColor, config.borderColor);

    row.forEach((cell, colIndex) => {
      const cellText =
        cell !== null && cell !== undefined ? cell.toString() : "N/A";

      const align =
        typeof cell === "number" ||
        cellText.startsWith("$") ||
        (!isNaN(parseFloat(cellText)) && isFinite(cellText))
          ? "right"
          : "left";

      doc
        .fillColor(config.textColor)
        .text(
          cellText,
          config.startX + colIndex * colWidth + 5,
          y + config.rowHeight / 3,
          {
            width: colWidth - 10,
            align: align,
            lineBreak: true,
            height: config.rowHeight - 15,
          }
        );
    });

    y += config.rowHeight;
    doc.y = y;
  });

  // Push doc.y for next section
  doc.y = y + 10;
}

export { signup, login, imageUpload, logout, exportData, getImage, getMe };
