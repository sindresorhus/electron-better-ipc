'use strict';

module.exports.getResponseChannels = channel => ({
	sendChannel: `%better-ipc-send-channel-${channel}`,
	dataChannel: `%better-ipc-response-data-channel-${channel}`,
	errorChannel: `%better-ipc-response-error-channel-${channel}`
});

module.exports.getRendererResponseChannels = (windowId, channel) => ({
	sendChannel: `%better-ipc-send-channel-${windowId}-${channel}`,
	dataChannel: `%better-ipc-response-data-channel-${windowId}-${channel}`,
	errorChannel: `%better-ipc-response-error-channel-${windowId}-${channel}`
});
