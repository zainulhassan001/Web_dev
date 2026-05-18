const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (io) => {
  // Authenticate socket connection using session
  io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.user) {
      socket.user = session.user;
      next();
    } else {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Join a conversation room — only if user is a participant
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conv = await Conversation.findById(conversationId).select('participants');
        if (!conv) return;
        const isParticipant = conv.participants.some(
          p => String(p) === String(socket.user._id)
        );
        if (isParticipant) {
          socket.join(conversationId);
        }
      } catch { /* silently reject invalid IDs */ }
    });

    // Send a message
    socket.on('send_message', async (data) => {
      const { conversationId, body } = data;
      if (!body || typeof body !== 'string' || !body.trim()) return;

      // Enforce max length from Message schema (1000 chars)
      const sanitizedBody = body.trim().slice(0, 1000);

      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          body: sanitizedBody
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: sanitizedBody,
          lastActivity: new Date()
        });

        // Populate sender info before emitting
        const populated = await message.populate('sender', 'name avatar');

        io.to(conversationId).emit('new_message', {
          _id: populated._id,
          body: populated.body,
          sender: populated.sender,
          createdAt: populated.createdAt
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (conversationId) => {
      socket.to(conversationId).emit('user_typing', { name: socket.user.name });
    });

    // Mark messages as read
    socket.on('mark_read', async (conversationId) => {
      await Message.updateMany(
        { conversation: conversationId, sender: { $ne: socket.user._id }, isRead: false },
        { isRead: true }
      );
      socket.to(conversationId).emit('messages_read', { by: socket.user._id });
    });

    socket.on('disconnect', () => {});
  });
};
