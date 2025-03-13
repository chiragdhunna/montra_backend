const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal Server error";
  err.statusCode ||= 500;

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    err.message = `Duplicate Field ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    err.message = `Invalid Format of ${errorPath}`;
    err.statusCode = 400;
  }

  const response = {
    success: false,
    message: err.message,
  };

  response.error = err;

  return res.status(err.statusCode).json(response);
};

const TryCatch = (passedFunction) => async (req, res, next) => {
  try {
    await passedFunction(req, res, next);
  } catch (error) {
    console.error(passedFunction, error);
    next(error);
  }
};

export { TryCatch, errorMiddleware };
