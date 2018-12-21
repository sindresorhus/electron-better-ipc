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

	if (window.webContents) {
		window.webContents.send(sendChannel, data);
	}
});

ipc.answerRenderer = (channel, callback) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const listener = async (event, data) => {
		const window = BrowserWindow.fromWebContents(event.sender);

		const send = (channel, data) => {
			if (!(window && window.isDestroyed())) {
				event.sender.send(channel, data);
			}
		};

		try {
			send(dataChannel, await callback(data, window));
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
