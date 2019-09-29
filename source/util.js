'use strict';

const getUniqueId = () => `${Date.now()}-${Math.random()}`;

const getSendChannel = channel => `%better-ipc-send-channel-${channel}`;
const getRendererSendChannel = (windowId, channel) => `%better-ipc-send-channel-${windowId}-${channel}`;

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

module.exports.getRendererResponseChannels = (windowId, channel) => {
	const id = getUniqueId();
	return {
		sendChannel: getRendererSendChannel(windowId, channel),
		dataChannel: `%better-ipc-response-data-channel-${windowId}-${channel}-${id}`,
		errorChannel: `%better-ipc-response-error-channel-${windowId}-${channel}-${id}`
	};
};
