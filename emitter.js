const crypto = require("crypto");
const fs = require("fs");
const socketIOClient = require("socket.io-client");
const path = require("path");
const http = require("http");

const socket = socketIOClient("http://timerseries.onrender.com"); // Replace with your server URL

// Load data from data.json
const dataPath = path.join(__dirname, "data.json");
const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Extract data array from JSON
const data = jsonData.data;

function encryptData(dataObj, key) {
  const iv = crypto.randomBytes(16); // Initialization Vector
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(dataObj), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function generateRandomData() {
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
}

function generateAndEmitData() {
  const numberOfMessages = Math.floor(Math.random() * 451) + 49; // Random number between 49 and 499

  const messages = [];
  const secretKey = crypto.randomBytes(32).toString("hex"); // Generate a random secret key

  for (let i = 0; i < numberOfMessages; i++) {
    const randomData = generateRandomData();
    const encryptedData = encryptData(randomData, secretKey);

    messages.push(encryptedData);
  }

  const messageString = messages
    .map(
      (message) => `${message.iv}|${message.encryptedData}|${message.authTag}`
    )
    .join("|");

  // Emit the message as an object with data, secretKey and authTag
  socket.emit("data", { data: messageString, secretKey });

  console.log(`Emitted ${numberOfMessages} encrypted messages.`);
}

const server = http.createServer(); // Create an HTTP server
const PORT = process.env.PORT || 3000; // Use the environment port or default to 3000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

setInterval(generateAndEmitData, 10000); // Emit data every 10 seconds
