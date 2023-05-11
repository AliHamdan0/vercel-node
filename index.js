const express = require('express');
const cors = require('cors');
const { users } = require('./users');
const userRouter = require('./routes/user');
const dot = require('dotenv').config();
const app = express();
const server = app.listen(process.env.PORT, () =>
  console.log('server is running')
);
const io = require('socket.io')(server, {
  cors: { origin: '*' },
  forceNew: true,
  transports: ['polling'],
}).listen(server);

app.use(cors());
app.use(express.json());

userRouter.post('/enter-user', (req, res) => {
  const { username } = req.body;
  users.push({ id: users.length, username, socket: '', numOfMsg: 0 });
  res.status(200).json({ id: users.length - 1, username }); //because now the index has increased
});

app.use('/', userRouter);

///this function runs every time a client connects to the server
io.on('connection', (socket) => {
  if (users.length > 0) {
    users[users.length - 1].socket = socket.id;
  }
  socket.on('send-message', (msg, room, user) => {
    if (room === '') socket.broadcast.emit('receive-message', msg, user, true);
    if (typeof room == 'number') {
      socket.broadcast.to(room).emit('receive-message', msg, user, true);
    } else {
      const recipientSocket = io.sockets.sockets.get(room);
      if (recipientSocket) {
        // Check if the recipient is joined to the other user room
        const isRecipientInRoom =
          recipientSocket &&
          Array.from(recipientSocket.rooms).includes(socket.id);
        recipientSocket.emit('receive-message', msg, user, isRecipientInRoom);
      }
    }
  });
  socket.on('join-room', (room) => {
    // Leave all previous rooms
    socket.leaveAll();
    socket.join(room);
  });
  //
  socket.on('initialize', () => {
    io.sockets.emit('users-list', users); //send to all users
  });
  socket.on('disconnect', () => {
    console.log('user is disconnected');
    let index = users.findIndex((user) => user.socket == socket.id); //remove current user
    users.splice(index, 1);
    io.sockets.emit('users-list', users);
  });
});
