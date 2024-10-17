module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected");

    // Присъединяване към стая
    socket.on("joinRoom", ({ room }) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);

      // Изпращане на съобщение до всички в стаята, че нов потребител е влязъл
      socket
        .to(room)
        .emit("message", `A new user has joined the room: ${room}`);
    });

    // Изпращане на съобщение
    socket.on("chatMessage", ({ room, message }) => {
      io.to(room).emit("message", message);
    });

    // Потребителят се разкачва
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
