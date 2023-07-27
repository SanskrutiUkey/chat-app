const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')
const app = express();

const server = http.createServer(app);
const io = socketio(server)

app.use(express.static(path.join(__dirname, 'public')))

const botname = 'ChatCord';
// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botname, 'Welcome to ChatCord!'))

        // Broadcast to all expect who is sending
        socket.broadcast.to(user.room).emit('message', formatMessage(botname, `${user.username} has joined the chat`));
        // io.emit('message', 'A user has joined the chat');

        // Send users and room info 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

    })

    // Listen for chatMessage (Server listen krke emit kr rha hai to the client)
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })

    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if (user) {
            io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`))
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
})

const PORT = 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));