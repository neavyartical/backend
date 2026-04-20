const { Server } = require("socket.io");

function socketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();

  function broadcastOnlineUsers() {
    io.emit("online-users", Array.from(onlineUsers.keys()));
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* =========================
       REGISTER USER
    ========================= */
    socket.on("register", (userId) => {
      try {
        if (!userId) return;

        onlineUsers.set(userId, socket.id);
        broadcastOnlineUsers();

        console.log("Registered:", userId);
      } catch (error) {
        console.log("Register error:", error.message);
      }
    });

    /* =========================
       SEND MESSAGE
    ========================= */
    socket.on("send-message", (data) => {
      try {
        if (!data?.receiverId) return;

        const targetSocket = onlineUsers.get(data.receiverId);

        if (targetSocket) {
          io.to(targetSocket).emit("receive-message", {
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.log("Message error:", error.message);
      }
    });

    /* =========================
       TYPING INDICATOR
    ========================= */
    socket.on("typing", (data) => {
      try {
        const targetSocket = onlineUsers.get(data.receiverId);

        if (targetSocket) {
          io.to(targetSocket).emit("user-typing", {
            senderId: data.senderId
          });
        }
      } catch (error) {
        console.log("Typing error:", error.message);
      }
    });

    /* =========================
       START CALL
    ========================= */
    socket.on("call-user", (data) => {
      try {
        if (!data?.receiverId) return;

        const targetSocket = onlineUsers.get(data.receiverId);

        if (targetSocket) {
          io.to(targetSocket).emit("incoming-call", {
            callerId: data.callerId,
            callerName: data.callerName || "Unknown",
            type: data.type || "audio"
          });
        }
      } catch (error) {
        console.log("Call error:", error.message);
      }
    });

    /* =========================
       ANSWER CALL
    ========================= */
    socket.on("answer-call", (data) => {
      try {
        const targetSocket = onlineUsers.get(data.callerId);

        if (targetSocket) {
          io.to(targetSocket).emit("call-answered", {
            receiverId: data.receiverId
          });
        }
      } catch (error) {
        console.log("Answer error:", error.message);
      }
    });

    /* =========================
       REJECT CALL
    ========================= */
    socket.on("reject-call", (data) => {
      try {
        const targetSocket = onlineUsers.get(data.callerId);

        if (targetSocket) {
          io.to(targetSocket).emit("call-rejected", {
            receiverId: data.receiverId
          });
        }
      } catch (error) {
        console.log("Reject error:", error.message);
      }
    });

    /* =========================
       END CALL
    ========================= */
    socket.on("end-call", (data) => {
      try {
        const targetSocket = onlineUsers.get(data.receiverId);

        if (targetSocket) {
          io.to(targetSocket).emit("call-ended", {
            userId: data.receiverId
          });
        }
      } catch (error) {
        console.log("End call error:", error.message);
      }
    });

    /* =========================
       DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
      try {
        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
            break;
          }
        }

        broadcastOnlineUsers();

        console.log("User disconnected:", socket.id);
      } catch (error) {
        console.log("Disconnect error:", error.message);
      }
    });
  });
}

module.exports = socketServer;
