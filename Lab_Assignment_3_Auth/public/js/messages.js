const socket = io();

// Get conversation ID from the page
const conversationId = document.getElementById('chatArea')?.dataset.conversationId;
if (conversationId) {
  socket.emit('join_conversation', conversationId);
}

// Send message
const form = document.getElementById('messageForm');
const input = document.getElementById('messageInput');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const body = input.value.trim();
  if (!body) return;
  socket.emit('send_message', { conversationId, body });
  input.value = '';
});

// Receive message
socket.on('new_message', (message) => {
  const chatBox = document.getElementById('chatMessages');
  if (!chatBox) return;
  const div = document.createElement('div');
  div.className = `message ${message.sender._id === currentUserId ? 'sent' : 'received'}`;

  const p = document.createElement('p');
  p.textContent = message.body;

  const time = document.createElement('small');
  time.textContent = new Date(message.createdAt).toLocaleTimeString();

  div.appendChild(p);
  div.appendChild(time);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Typing indicator
input?.addEventListener('input', () => {
  socket.emit('typing', conversationId);
});

socket.on('user_typing', (data) => {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.textContent = `${data.name} is typing...`;
    clearTimeout(window._typingTimeout);
    window._typingTimeout = setTimeout(() => { indicator.textContent = ''; }, 2000);
  }
});
