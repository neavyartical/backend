const { Server } = require("socket.io");

function socketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* =========================
       REGISTER USER
    ========================= */
    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    /* =========================
       SEND MESSAGE
    ========================= */
    socket.on("send-message", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("receive-message", data);
      }
    });

    /* =========================
       START CALL
    ========================= */
    socket.on("call-user", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("incoming-call", {
          callerId: data.callerId,
          callerName: data.callerName,
          type: data.type
        });
      }
    });

    /* =========================
       ANSWER CALL
    ========================= */
    socket.on("answer-call", (data) => {
      const targetSocket = onlineUsers.get(data.callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-answered", {
          receiverId: data.receiverId
        });
      }
    });

    /* =========================
       END CALL
    ========================= */
    socket.on("end-call", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended", {
          userId: data.receiverId
        });
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
}

module.exports = socketServer;
