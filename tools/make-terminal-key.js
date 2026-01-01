const crypto = require("crypto");

function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}
function randomKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

const PEPPER = process.env.TERMINAL_KEY_PEPPER;
if (!PEPPER) {
  console.error("Set TERMINAL_KEY_PEPPER in your environment first.");
  process.exit(1);
}

const rawKey = randomKey(32);
const apiKeyHash = sha256Hex(`${PEPPER}:${rawKey}`);

console.log("RAW_TERMINAL_KEY=");
console.log(rawKey);
console.log("\napi_key_hash=");
console.log(apiKeyHash);
