const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io=socketio(server, {cors: {origin: "*"}});
const PORT=process.env.PORT || 5000

app.use(cors());
app.use(router);

io.on('connection',(s)=>{
console.log('We have a new connection!');

s.on('join', ({name,room}, callback)=>{
const {error, user} =addUser({id:s.id, name, room});

if(error) return callback(error);

s.emit('message',{user:'admin', text:`${user.name}, welcome to the room ${user.room}. Type something to know no of users in the room.`});
s.broadcast.to(user.room).emit('message',{user:'admin', text:`${user.name}, has joined.`});

s.join(user.room);

callback();  //for frontend
})

s.on('sendMessage', (message, callback) => {

  const user = getUser(s.id);

  io.to(user.room).emit('message',
    { user: user.name, text: message });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
  });
  callback();
})


s.on('disconnect',()=>{
  
  const user= removeUser(s.id);
  if(user){
    
    io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left.`})


    const usersInRoom = getUsersInRoom(user.room);
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: usersInRoom,
    });
  }

})

})

server.listen(PORT, ()=>{
  console.log(`Server is running on ${PORT}`)
})