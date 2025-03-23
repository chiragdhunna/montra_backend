import multer from "multer";
import path from "path";
const __dirname = path.resolve();

const storageConfig = multer.diskStorage({
  // destinations is uploads folder
  // under the project directory
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    // file name is prepended with current time
    // in milliseconds to handle duplicate file names
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// file filter for filtering only images
const fileFilterConfig = function (req, file, cb) {
  console.log("🔍 Received file:", file.originalname);
  console.log("📂 Detected MIME Type:", file.mimetype);

  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    console.log("✅ File type is allowed");
    cb(null, true);
  } else {
    console.log("❌ File type is not allowed!");
    cb(new Error("Invalid file type"), false);
  }
};

// creating multer object for storing
// with configuration
const upload = multer({
  // applying storage and file filter
  storage: storageConfig,
  limits: {
    // limits file size to 5 MB
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilterConfig,
});

export { upload };
