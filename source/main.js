'use strict';
const electron = require('electron');
const {serializeError, deserializeError} = require('serialize-error');
const util = require('./util.js');

const {ipcMain, BrowserWindow} = electron;
const ipc = Object.create(ipcMain || {});

ipc.callRenderer = (browserWindow, channel, data) => new Promise((resolve, reject) => {
	if (!browserWindow) {
		throw new Error('Browser window required');
	}

	const {sendChannel, dataChannel, errorChannel} = util.getRendererResponseChannels(channel);

	const cleanup = () => {
		ipcMain.off(dataChannel, onData);
		ipcMain.off(errorChannel, onError);
	};

	const onData = (event, result) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (window.id === browserWindow.id) {
			cleanup();
			resolve(result);
		}
	};

	const onError = (event, error) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (window.id === browserWindow.id) {
			cleanup();
			reject(deserializeError(error));
		}
	};

	ipcMain.on(dataChannel, onData);
	ipcMain.on(errorChannel, onError);

	const completeData = {
		dataChannel,
		errorChannel,
		userData: data
	};

	if (browserWindow.webContents) {
		browserWindow.webContents.send(sendChannel, completeData);
	}
});

ipc.callFocusedRenderer = async (...args) => {
	const focusedWindow = BrowserWindow.getFocusedWindow();
	if (!focusedWindow) {
		throw new Error('No browser window in focus');
	}

	return ipc.callRenderer(focusedWindow, ...args);
};

ipc.answerRenderer = (browserWindowOrChannel, channelOrCallback, callbackOrNothing) => {
	let window;
	let channel;
	let callback;

	if (callbackOrNothing === undefined) {
		channel = browserWindowOrChannel;
		callback = channelOrCallback;
	} else {
		window = browserWindowOrChannel;
		channel = channelOrCallback;
		callback = callbackOrNothing;

		if (!window) {
			throw new Error('Browser window required');
		}
	}

	const sendChannel = util.getSendChannel(channel);

	const listener = async (event, data) => {
		const browserWindow = BrowserWindow.fromWebContents(event.sender);

		if (window && window.id !== browserWindow.id) {
			return;
		}

		const send = (channel, data) => {
			if (!(browserWindow && browserWindow.isDestroyed())) {
				event.sender.send(channel, data);
			}
		};

		const {dataChannel, errorChannel, userData} = data;

		try {
			send(dataChannel, await callback(userData, browserWindow));
		} catch (error) {
			send(errorChannel, serializeError(error));
		}
	};

	ipcMain.on(sendChannel, listener);

	return () => {
		ipcMain.off(sendChannel, listener);
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
