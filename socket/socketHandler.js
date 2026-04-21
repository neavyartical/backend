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

    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      emitOnlineUsers();
    });

    socket.on("send-message", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("receive-message", data);
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-typing", { senderId });
      }
    });

    socket.on("stop-typing", ({ senderId, receiverId }) => {
      const targetSocket = onlineUsers.get(receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("user-stop-typing", { senderId });
      }
    });

    socket.on("call-user", (data) => {
      const targetSocket = onlineUsers.get(data.receiverId);

      if (targetSocket) {
        io.to(targetSocket).emit("incoming-call", data);
      }
    });

    socket.on("answer-call", (data) => {
      const targetSocket = onlineUsers.get(data.callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-answered", data);
      }
    });

    socket.on("reject-call", (data) => {
      const targetSocket = onlineUsers.get(data.callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-rejected", data);
      }
    });

    socket.on("ice-candidate", (data) => {
      const targetSocket = onlineUsers.get(data.targetUserId);

      if (targetSocket) {
        io.to(targetSocket).emit("ice-candidate", data);
      }
    });

    socket.on("end-call", (data) => {
      const targetSocket =
        onlineUsers.get(data.receiverId) ||
        onlineUsers.get(data.callerId);

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended");
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }

      emitOnlineUsers();
    });
  });
}

module.exports = socketServer;
