
const { Server } = require("socket.io");

function socketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();

  /* =========================
     SOCKET CONNECTION
  ========================= */
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* =========================
       REGISTER USER
    ========================= */
    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);

      io.emit("online-users", Array.from(onlineUsers.keys()));

      console.log(`User registered: ${userId}`);
    });

    /* =========================
       SEND LIVE MESSAGE
    ========================= */
    socket.on("send-message", (data) => {
      const {
        sender,
        receiverId,
        text
      } = data;

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("receive-message", {
          sender,
          text,
          createdAt: new Date()
        });
      }
    });

    /* =========================
       START CALL
    ========================= */
    socket.on("call-user", (data) => {
      const {
        callerId,
        callerName,
        receiverId,
        type
      } = data;

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("incoming-call", {
          callerId,
          callerName,
          type
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
      } = data;

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
      } = data;

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
        receiverId
      } = data;

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended");
      }
    });

    /* =========================
       TYPING INDICATOR
    ========================= */
    socket.on("typing", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("typing", {
          senderId: data.senderId
        });
      }
    });

    /* =========================
       STOP TYPING
    ========================= */
    socket.on("stop-typing", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("stop-typing", {
          senderId: data.senderId
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
