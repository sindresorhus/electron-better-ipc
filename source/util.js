'use strict';

const getUniqueId = () => `${Date.now()}-${Math.random()}`;

const getSendChannel = channel => `%better-ipc-send-channel-${channel}`;
const getRendererSendChannel = channel => `%better-ipc-send-channel-${channel}`;

module.exports.currentWindowChannel = '%better-ipc-current-window';

module.exports.getSendChannel = getSendChannel;
module.exports.getRendererSendChannel = getRendererSendChannel;

module.exports.getResponseChannels = channel => {
	const id = getUniqueId();
	return {
		sendChannel: getSendChannel(channel),
		dataChannel: `%better-ipc-response-data-channel-${channel}-${id}`,
		errorChannel: `%better-ipc-response-error-channel-${channel}-${id}`
	};
};

module.exports.getRendererResponseChannels = channel => {
	const id = getUniqueId();
	return {
		sendChannel: getRendererSendChannel(channel),
		dataChannel: `%better-ipc-response-data-channel-${channel}-${id}`,
		errorChannel: `%better-ipc-response-error-channel-${channel}-${id}`
	};
};
