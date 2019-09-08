const socket = io();

// socket.on('countUpdated', count => {
// 	console.log('The count has been updated', count);
// });

// document.querySelector('#increment').addEventListener('click', e => {
// 	socket.emit('increment');
// });

const form = document.querySelector('#message-form');
const input = form.querySelector('[name=message]');
const submitBtn = form.querySelector('button');
const messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-link-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

form.addEventListener('submit', e => {
	e.preventDefault();

	submitBtn.setAttribute('disabled', 'disabled');

	const message = e.target.elements.message.value;
	socket.emit('sendMessage', message, error => {
		submitBtn.removeAttribute('disabled');
		input.value = '';
		input.focus();
		if (error) {
			return console.log(error);
		} else {
			console.log('The message was delivered');
		}
	});
});

const autoscroll = () => {
	// New message element
	const newMessage = messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle(newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHight = newMessage.offsetHeight + newMessageMargin;

	// Visible height
	const visibleHeight = messages.offsetHeight;

	// Height of messages container
	const containerHeight = messages.scrollHeight;

	//How far am I scrolled?
	const scrollOffset = messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHight <= scrollOffset) {
		messages.scrollTop = containerHeight;
	}
};

socket.on('message', message => {
	console.log(message);

	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('locationMessage', message => {
	const html = Mustache.render(locationTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')
	});

	messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});

	document.querySelector('#sidebar').innerHTML = html;
});

const locationBtn = document.querySelector('#send-location');

locationBtn.addEventListener('click', e => {
	if (!navigator.geolocation) {
		return alert('GeoLocation is not supported by your browser');
	}
	locationBtn.setAttribute('disabled', 'disabled');
	navigator.geolocation.getCurrentPosition(position => {
		socket.emit(
			'sendLocation',
			`https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
			msg => {
				console.log(msg);
				locationBtn.removeAttribute('disabled');
			}
		);
	});
});

socket.emit('join', { username, room }, error => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
