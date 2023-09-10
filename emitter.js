const crypto = require("crypto");
const fs = require("fs");
const socketIOClient = require("socket.io-client");
const path = require("path");

const socket = socketIOClient("https://timerseries.onrender.com"); // Replace with your server URL

// Load data from data.json
const dataPath = path.join(__dirname, "data.json");
const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Extract data array from JSON
const data = jsonData.data;

function encryptData(dataObj, key) {
  const iv = crypto.randomBytes(16); // Initialization Vector
  const cipher = crypto.createCipheriv(
    "aes-256-ctr",
    Buffer.from(key, "hex"),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(dataObj), "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
  };
}

function generateRandomData() {
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
}

function generateAndEmitData() {
  const numberOfMessages = Math.floor(Math.random() * 451) + 49; // Random number between 49 and 499

  const messages = [];
  for (let i = 0; i < numberOfMessages; i++) {
    const randomData = generateRandomData();
    const secretKey = crypto.randomBytes(32).toString("hex"); // Generate a random secret key
    const encryptedData = encryptData(randomData, secretKey);

    messages.push(encryptedData);
  }

  const messageString = messages
    .map((message) => `${message.iv}|${message.encryptedData}`)
    .join("|");

  socket.emit("encryptedData", messageString);

  console.log(`Emitted ${numberOfMessages} encrypted messages.`);
}

setInterval(generateAndEmitData, 10000); // Emit data every 10 seconds
