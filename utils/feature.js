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
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    // calling callback with true
    // as mimetype of file is image
    cb(null, true);
  } else {
    // false to indicate not to store the file
    cb(null, false);
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
