const fs = require("fs");

// read file from disk
const fileData = fs.readFileSync("input.csv");

// convert file to base64 string
const base64Data = Buffer.from(fileData).toString("base64");
console.log(base64Data);
