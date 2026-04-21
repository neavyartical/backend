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
     EMIT ONLINE USERS
  ========================= */
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

      console.log("Registered:", userId);
    });

    /* =========================
       SEND PRIVATE MESSAGE
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
       TYPING STATUS
    ========================= */
    socket.on("typing", ({ senderId, receiverId }) => {
      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-typing", {
          senderId
        });
      }
    });

    socket.on("stop-typing", ({ senderId, receiverId }) => {
      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-stop-typing", {
          senderId
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
        offer,
        type
      } = data || {};

      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("incoming-call", {
          callerId,
          callerName,
          offer,
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
        receiverId,
        answer
      } = data || {};

      const targetSocket = onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-answered", {
          receiverId,
          answer
        });
      }
    });

    /* =========================
       ICE CANDIDATE
    ========================= */
    socket.on("ice-candidate", (data) => {
      const {
        targetUserId,
        candidate
      } = data || {};

      const targetSocket = onlineUsers.get(targetUserId);

      if (targetSocket) {
        io.to(targetSocket).emit("ice-candidate", {
          candidate
        });
      }
    });

    /* =========================
       REJECT / DECLINE CALL
    ========================= */
    socket.on("reject-call", ({ callerId, receiverId }) => {
      const targetSocket = onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-rejected", {
          receiverId
        });
      }
    });

    socket.on("decline-call", ({ callerId }) => {
      const targetSocket = onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-declined");
      }
    });

    /* =========================
       END CALL
    ========================= */
    socket.on("end-call", ({ callerId, receiverId }) => {
      const targetSocket =
        onlineUsers.get(receiverId) ||
        onlineUsers.get(callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended");
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
