const fs = require("fs");
const io = require("socket.io-client");
const crypto = require("crypto");

const data = require("./data.json");

// Function to generate a random integer within a range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const socket = io.connect("https://timerseries.onrender.com", {
  transports: ["websocket"], // Use only WebSocket transport
});

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

    // Generate a secret key as a SHA-256 hash of the message
    const secret_key = crypto
      .createHash("sha256")
      .update(JSON.stringify(originalMessage))
      .digest("hex");

    // Create an encryption key and IV for AES-GCM
    const encryptionKey = crypto.randomBytes(32); // 32 bytes for AES-256
    const iv = crypto.randomBytes(12); // 12 bytes for AES-GCM IV

    // Create an AES-GCM cipher
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);

    // Encrypt the message and get the authentication tag
    let encryptedMessage = cipher.update(
      JSON.stringify(originalMessage),
      "utf8",
      "hex"
    );
    encryptedMessage += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    // Combine IV, encrypted message, and authentication tag in a specific order
    const encryptedPayload = iv.toString("hex") + encryptedMessage + authTag;

    // Base64 encode the payload before sending
    const payload64 = Buffer.from(encryptedPayload, "hex").toString("base64");

    messages.push(payload64);
  }

  const messageStream = messages.join("|");
  console.log(messageStream);
  socket.emit("encryptedMessageStream", messageStream);

  setTimeout(emitEncryptedMessages, 10000); // Emit messages every 10 seconds
}

socket.on("connect", () => {
  console.log("Emitter connected");
  emitEncryptedMessages(); // Start emitting messages when connected to the listener
});
