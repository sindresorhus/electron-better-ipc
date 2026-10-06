import electron from 'electron';
import {serializeError, deserializeError} from 'serialize-error';
import {getResponseChannels} from './util.js';

const {ipcMain, BrowserWindow} = electron;
const ipc = Object.create(ipcMain || {});

ipc.callRenderer = (browserWindow, channel, data, {signal} = {}) => {
	const {promise, resolve, reject} = Promise.withResolvers();

	if (!browserWindow) {
		reject(new Error('Browser window required'));
		return promise;
	}

	if (typeof channel !== 'string' || channel.length === 0) {
		reject(new Error('Channel required'));
		return promise;
	}

	if (!browserWindow.webContents || browserWindow.isDestroyed?.() || browserWindow.webContents.isDestroyed?.()) {
		reject(new Error('Browser window is destroyed'));
		return promise;
	}

	if (signal?.aborted) {
		reject(signal.reason);
		return promise;
	}

	const {sendChannel, dataChannel, errorChannel} = getResponseChannels(channel);

	const cleanup = () => {
		ipcMain.off(dataChannel, onData);
		ipcMain.off(errorChannel, onError);
		signal?.removeEventListener('abort', onAbort);
	};

	const targetId = browserWindow.id;
	const isFromTargetWindow = event => {
		const senderWindow = BrowserWindow.fromWebContents(event.sender);
		return targetId !== undefined && senderWindow !== undefined && senderWindow !== null && senderWindow.id === targetId;
	};

	const onData = (event, result) => {
		if (!isFromTargetWindow(event)) {
			return;
		}

		cleanup();
		resolve(result);
	};

	const onError = (event, error) => {
		if (!isFromTargetWindow(event)) {
			return;
		}

		cleanup();
		reject(deserializeError(error));
	};

	const onAbort = () => {
		cleanup();
		reject(signal.reason);
	};

	ipcMain.on(dataChannel, onData);
	ipcMain.on(errorChannel, onError);
	signal?.addEventListener('abort', onAbort, {once: true});

	try {
		browserWindow.webContents.send(sendChannel, {
			dataChannel,
			errorChannel,
			userData: data,
		});
	} catch (error) {
		cleanup();
		reject(error);
	}

	return promise;
};

ipc.callFocusedRenderer = async (...arguments_) => {
	const focusedWindow = BrowserWindow.getFocusedWindow();
	if (!focusedWindow) {
		throw new Error('No browser window in focus');
	}

	return ipc.callRenderer(focusedWindow, ...arguments_);
};

ipc.answerRenderer = (browserWindowOrChannel, channelOrCallback, callbackOrNothing) => {
	let expectedWindow;
	let channel;
	let callback;

	if (callbackOrNothing === undefined) {
		channel = browserWindowOrChannel;
		callback = channelOrCallback;
	} else {
		expectedWindow = browserWindowOrChannel;
		channel = channelOrCallback;
		callback = callbackOrNothing;

		if (!expectedWindow) {
			throw new Error('Browser window required');
		}
	}

	ipcMain.handle(channel, async (event, data) => {
		const senderWindow = BrowserWindow.fromWebContents(event.sender);

		if (expectedWindow && (!senderWindow || expectedWindow.id !== senderWindow.id)) {
			return {error: serializeError(new Error('Message received for a different window'))};
		}

		try {
			return {value: await callback(data, senderWindow)};
		} catch (error) {
			return {error: serializeError(error)};
		}
	});

	return () => {
		ipcMain.removeHandler(channel);
	};
};

ipc.sendToRenderers = (channel, data) => {
	for (const browserWindow of BrowserWindow.getAllWindows()) {
		if (browserWindow.webContents) {
			browserWindow.webContents.send(channel, data);
		}
	}
};

export {ipc as ipcMain};
