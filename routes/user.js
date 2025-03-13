import express from "express";
import { imageUpload, login, signup } from "../controllers/user.js";

const app = express.Router();

app.post("/signup", signup);
app.post("/login", login);
app.post("/imageupload", imageUpload);

export default app;
