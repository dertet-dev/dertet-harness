const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "index.html");
const destDir = path.join(__dirname, "..", "dist", "renderer");
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, "index.html"));
console.log("Copied index.html ->", destDir);

const iconSrc = path.join(__dirname, "..", "build-resources", "icon.ico");
const iconDestDir = path.join(__dirname, "..", "dist", "electron");
fs.mkdirSync(iconDestDir, { recursive: true });
fs.copyFileSync(iconSrc, path.join(iconDestDir, "icon.ico"));
console.log("Copied icon.ico ->", iconDestDir);
