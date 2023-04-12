const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "./.env") });

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

const registerRoute = require("./routes/uploadCSV.route");
const authRoute = require("./routes/auth.route");

app.use("/", registerRoute);
app.use("/auth", authRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port: ${port}`));
