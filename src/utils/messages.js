const generateMessage = (username, text) => {
	return {
		username,
		text,
		createdAt: new Date().getTime()
	};
};

const generateLocation = (username, position) => {
	return {
		username,
		position,
		createdAt: new Date().getTime()
	};
};

module.exports = { generateMessage, generateLocation };
