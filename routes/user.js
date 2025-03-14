import express from "express";
import { imageUpload, login, signup } from "../controllers/user.js";
import { authentication } from "../middlewares/auth.js";
import { upload } from "../utils/feature.js";

const app = express.Router();

app.post("/signup", signup);
app.post("/login", login);

app.use(authentication);

app.post("/imageupload", upload.single("file"), imageUpload);

export default app;
