'use strict';
const electron = require('electron');
const util = require('./util');

const {ipcMain, BrowserWindow} = electron;
const ipc = Object.create(ipcMain);

ipc.callRenderer = (browserWindow, channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getRendererResponseChannels(browserWindow.id, channel);

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

	if (browserWindow.webContents) {
		browserWindow.webContents.send(sendChannel, completeData);
	}
});

ipc.answerRenderer = (channel, callback) => {
	const sendChannel = util.getSendChannel(channel);

	const listener = async (event, data) => {
		const browserWindow = BrowserWindow.fromWebContents(event.sender);

		const send = (channel, data) => {
			if (!(browserWindow && browserWindow.isDestroyed())) {
				event.sender.send(channel, data);
			}
		};

		const {dataChannel, errorChannel, userData} = data;

		try {
			send(dataChannel, await callback(userData, browserWindow));
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
	for (const browserWindow of BrowserWindow.getAllWindows()) {
		if (browserWindow.webContents) {
			browserWindow.webContents.send(channel, data);
		}
	}
};

module.exports = ipc;
