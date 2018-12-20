'use strict';
const electron = require('electron');
const util = require('./util');

const {ipcMain: ipc, BrowserWindow} = electron;

ipc.callRenderer = (window, channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getRendererResponseChannels(window.id, channel);

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

	if (window.webContents) {
		window.webContents.send(sendChannel, completeData);
	}
});

ipc.answerRenderer = (channel, callback) => {
	const sendChannel = util.getSendChannel(channel);

	const listener = async (event, data) => {
		const window = BrowserWindow.fromWebContents(event.sender);

		const send = (channel, data) => {
			if (!(window && window.isDestroyed())) {
				event.sender.send(channel, data);
			}
		};

		const {dataChannel, errorChannel, userData} = data;

		try {
			send(dataChannel, await callback(userData, window));
		} catch (error) {
			send(errorChannel, error);
		}
	};

	ipc.on(sendChannel, listener);
	return () => {
		ipc.removeListener(sendChannel, listener);
	};
};

ipc.sendToRenderers = (channel, data) => {
	for (const window of BrowserWindow.getAllWindows()) {
		if (window.webContents) {
			window.webContents.send(channel, data);
		}
	}
};

module.exports = ipc;
