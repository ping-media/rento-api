const crypto = require("crypto");

function generateTempId() {
  const randomPart = crypto.randomBytes(4).toString("hex"); // 8 chars
  return `TEMP-${randomPart}`;
}

module.exports = { generateTempId };
