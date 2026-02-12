const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true
  },
  transports: ["polling", "websocket"]
});

console.log("=== TEST SOCKET.IO FROM BACKEND DIR ===");

// Middleware
io.use((socket, next) => {
  console.log("✅ MIDDLEWARE EXECUTED! Socket ID:", socket.id);
  console.log("Query:", socket.handshake.query);
  next();
});

// Event listener
io.on("connection", (socket) => {
  console.log("🎯 CONNECTION EVENT! Socket ID:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
  
  socket.emit("test", { message: "Hello from test" });
});

server.listen(3003, () => {
  console.log("Test server listening on port 3003");
  
  // Auto-test
  setTimeout(() => {
    const { exec } = require('child_process');
    console.log("\n=== TESTING WITH CURL ===");
    exec('curl -s "http://localhost:3003/socket.io/?token=TEST&EIO=4&transport=polling"', (error, stdout) => {
      console.log("Curl response:", stdout);
      console.log("\n=== TESTING WEBSOCKET ===");
      exec('curl -i -H "Connection: Upgrade" -H "Upgrade: websocket" "http://localhost:3003/socket.io/?token=TEST&EIO=4&transport=websocket" 2>&1 | head -20', (error, stdout) => {
        console.log("WebSocket test:", stdout);
        console.log("\n=== END TEST ===");
        process.exit(0);
      });
    });
  }, 1000);
});
