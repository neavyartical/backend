const { Server } = require("socket.io");

function socketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();

  function emitOnlineUsers() {
    io.emit("online-users", Array.from(onlineUsers.keys()));
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* =========================
       REGISTER USER
    ========================= */
    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);

      socket.userId = userId;

      emitOnlineUsers();

      console.log(`Registered ${userId}`);
    });

    /* =========================
       PRIVATE MESSAGE
    ========================= */
    socket.on("send-message", (data) => {
      const {
        senderId,
        receiverId,
        text,
        createdAt
      } = data || {};

      if (!receiverId || !text) return;

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("receive-message", {
          senderId,
          receiverId,
          text,
          createdAt: createdAt || new Date()
        });
      }
    });

    /* =========================
       START CALL
    ========================= */
    socket.on("call-user", (data) => {
      const {
        callerId,
        receiverId,
        callerName,
        type
      } = data || {};

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("incoming-call", {
          callerId,
          callerName,
          type: type || "audio"
        });
      }
    });

    /* =========================
       ANSWER CALL
    ========================= */
    socket.on("answer-call", (data) => {
      const {
        callerId,
        receiverId
      } = data || {};

      const targetSocket = onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-answered", {
          receiverId
        });
      }
    });

    /* =========================
       REJECT CALL
    ========================= */
    socket.on("reject-call", (data) => {
      const {
        callerId,
        receiverId
      } = data || {};

      const targetSocket = onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-rejected", {
          receiverId
        });
      }
    });

    /* =========================
       END CALL
    ========================= */
    socket.on("end-call", (data) => {
      const {
        receiverId,
        callerId
      } = data || {};

      const targetSocket =
        onlineUsers.get(receiverId) ||
        onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended");
      }
    });

    /* =========================
       TYPING STATUS
    ========================= */
    socket.on("typing", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-typing", {
          senderId: data.senderId
        });
      }
    });

    socket.on("stop-typing", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-stop-typing", {
          senderId: data.senderId
        });
      }
    });

    /* =========================
       DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      } else {
        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
            break;
          }
        }
      }

      emitOnlineUsers();

      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = socketServer;
