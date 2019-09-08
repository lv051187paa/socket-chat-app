const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocation } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const publicDirectoryPath = path.join(__dirname + '/../public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 3000;

io.on('connection', socket => {
	console.log('New web socket connection');

	// socket.emit('countUpdated', count);

	// socket.on('increment', () => {
	// 	count++;
	// 	// socket.emit('countUpdated', count);
	// 	io.emit('countUpdated', count);
	// });

	socket.on('sendMessage', (msg, callback) => {
		const filter = new Filter();

		if (filter.isProfane(msg)) {
			return callback('Profantity is not allowed');
		}
		const user = getUser(socket.id);

		if (user) {
			io.to(user.room).emit('message', generateMessage(user.username, msg));
			callback('Delivered');
		}
	});

	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({
			id: socket.id,
			username,
			room
		});

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('message', generateMessage('Admin', 'Welcome'));
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
		io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

		callback();
	});

	socket.on('sendLocation', (position, callback) => {
		const user = getUser(socket.id);

		socket.broadcast.emit('locationMessage', generateLocation(user.username, position));
		callback('Location shared');
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
			io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
		}
	});
});

server.listen(port, () => console.log(`Listen on port ${port}...`));
