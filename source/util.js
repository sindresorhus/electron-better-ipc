export const getSendChannel = channel => `%better-ipc-send-channel-${channel}`;

export const getResponseChannels = channel => {
	const id = crypto.randomUUID();
	return {
		sendChannel: getSendChannel(channel),
		dataChannel: `%better-ipc-response-data-channel-${channel}-${id}`,
		errorChannel: `%better-ipc-response-error-channel-${channel}-${id}`,
	};
};
