const fs = require("fs");
const io = require("socket.io-client");
const crypto = require("crypto");

const data = require("./data.json");

// Function to generate a random integer within a range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a SHA-256 hash
function generateHash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

const socket = io.connect("http://localhost:3000"); // Connect to the listener service

// Function to generate and emit the encrypted message stream
function emitEncryptedMessages() {
  const messages = [];

  // Generate a random number of messages (between 49 and 499)
  const numberOfMessages = getRandomInt(49, 499);

  for (let i = 0; i < numberOfMessages; i++) {
    const name = data.names[getRandomInt(0, data.names.length - 1)];
    const origin = data.cities[getRandomInt(0, data.cities.length - 1)];
    const destination = data.cities[getRandomInt(0, data.cities.length - 1)];

    const originalMessage = {
      name,
      origin,
      destination,
    };

    const secret_key = generateHash(JSON.stringify(originalMessage));

    const encryptedMessage = crypto
      .createCipher("aes-256-ctr", "your_pass_key_here")
      .update(
        JSON.stringify({ ...originalMessage, secret_key }),
        "utf8",
        "hex"
      );

    messages.push(encryptedMessage);
  }

  const messageStream = messages.join("|");
  socket.emit("encryptedMessageStream", messageStream);

  setTimeout(emitEncryptedMessages, 10000); // Emit messages every 10 seconds
}

socket.on("connect", () => {
  emitEncryptedMessages(); // Start emitting messages when connected to the listener
});
