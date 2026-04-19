const { Server } = require("socket.io");

let io;
const onlineUsers = new Map();

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* =========================
       USER ONLINE
    ========================= */
    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    /* =========================
       SEND MESSAGE
    ========================= */
    socket.on("send-message", (data) => {
      const receiverSocket = onlineUsers.get(data.receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("new-message", data);
      }
    });

    /* =========================
       START CALL
    ========================= */
    socket.on("start-call", (data) => {
      const receiverSocket = onlineUsers.get(data.receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("incoming-call", data);
      }
    });

    /* =========================
       END CALL
    ========================= */
    socket.on("end-call", (data) => {
      const receiverSocket = onlineUsers.get(data.receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("call-ended", data);
      }
    });

    /* =========================
       DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  getIO
};
