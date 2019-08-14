'use strict';
const electron = require('electron');
const util = require('./util');

const {ipcRenderer} = electron;
const ipc = Object.create(ipcRenderer);

ipc.callMain = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipc.off(dataChannel, onData);
		ipc.off(errorChannel, onError);
	};

	const onData = (event, result) => {
		cleanup();
		resolve(result);
	};

	const onError = (event, error) => {
		cleanup();
		reject(error);
	};

	ipc.once(dataChannel, (event, result) => {
		onData(event, result);
	});

	ipc.once(errorChannel, (event, error) => {
		onError(event, error);
	});

	const completeData = {
		dataChannel,
		errorChannel,
		userData: data
	};

	ipc.send(sendChannel, completeData);
});

ipc.answerMain = (channel, callback) => {
	const browserWindow = electron.remote.getCurrentWindow();
	const sendChannel = util.getRendererSendChannel(browserWindow.id, channel);

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
		ipc.off(sendChannel, listener);
	};
};

module.exports = ipc;
