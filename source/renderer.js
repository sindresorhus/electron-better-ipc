'use strict';
const electron = require('electron');
const util = require('./util');

const {ipcRenderer: ipc} = electron;

ipc.callMain = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipc.removeAllListeners(dataChannel);
		ipc.removeAllListeners(errorChannel);
	};

	ipc.on(dataChannel, (event, result) => {
		cleanup();
		resolve(result);
	});

	ipc.on(errorChannel, (event, error) => {
		cleanup();
		reject(error);
	});

	const completeData = {
		dataChannel,
		errorChannel,
		userData: data
	};

	ipc.send(sendChannel, completeData);
});

ipc.answerMain = (channel, callback) => {
	const window = electron.remote.getCurrentWindow();
	const sendChannel = util.getRendererSendChannel(window.id, channel);

	const listener = async (event, data) => {
		const {dataChannel, errorChannel, userData} = data;

		try {
			ipc.send(dataChannel, await callback(userData));
		} catch (error) {
			ipc.send(errorChannel, error);
		}
	};

	ipc.on(sendChannel, listener);
	return () => {
		ipc.removeListener(sendChannel, listener);
	};
};

module.exports = ipc;
