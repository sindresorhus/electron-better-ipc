'use strict';
const electron = window.require('electron');
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

	ipc.send(sendChannel, data);
});

ipc.answerMain = (channel, callback) => {
	const window = electron.remote.getCurrentWindow();
	const {sendChannel, dataChannel, errorChannel} = util.getRendererResponseChannels(window.id, channel);

	const listener = async (event, data) => {
		try {
			ipc.send(dataChannel, await callback(data));
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
