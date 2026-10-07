import electron from 'electron';
import {serializeError} from 'serialize-error';
import {callChannel, forwardChannel, waitForReply} from './util.js';

const {ipcMain, BrowserWindow, MessageChannelMain} = electron;
const ipc = Object.create(ipcMain || {});

ipc.callRenderer = async (target, channel, data, {signal} = {}) => {
	if (!target) {
		throw new Error('Browser window required');
	}

	if (typeof channel !== 'string' || channel.length === 0) {
		throw new Error('Channel required');
	}

	// Check the target first, since reading `webContents` of a destroyed `BrowserWindow` throws.
	const webContents = target.isDestroyed() ? undefined : (target.webContents ?? target);
	if (!webContents || webContents.isDestroyed()) {
		throw new Error('Browser window is destroyed');
	}

	signal?.throwIfAborted();

	const {port1, port2} = new MessageChannelMain();
	webContents.postMessage(callChannel, {channel, data}, [port2]);
	return waitForReply(port1, signal);
};

ipc.callFocusedRenderer = async (...arguments_) => {
	const focusedWindow = BrowserWindow.getFocusedWindow();
	if (!focusedWindow) {
		throw new Error('No browser window in focus');
	}

	return ipc.callRenderer(focusedWindow, ...arguments_);
};

ipc.answerRenderer = (channel, callback) => {
	ipcMain.handle(channel, async (event, data) => {
		try {
			return {value: await callback(data, BrowserWindow.fromWebContents(event.sender) ?? undefined)};
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

// Pass the port of an `ipcRenderer.callRenderer` call on to the target page, which then replies to the caller directly.
const forwardRendererCall = (event, message) => {
	// `ports` is not set when a renderer uses `ipcRenderer.send()` instead of `ipcRenderer.postMessage()`.
	const [port] = event.ports ?? [];
	if (!port) {
		return;
	}

	try {
		const {webContentsId, channel, data} = message;

		const webContents = electron.webContents.fromId(webContentsId);
		if (!webContents || webContents.isDestroyed()) {
			throw new Error(`No web contents with ID ${webContentsId}`);
		}

		webContents.postMessage(callChannel, {channel, data, senderId: event.sender.id}, [port]);
	} catch (error) {
		port.postMessage({error: serializeError(error)});
	}
};

// Another copy of this module may already forward the calls.
if (ipcMain?.listenerCount(forwardChannel) === 0) {
	ipcMain.on(forwardChannel, forwardRendererCall);
}

export {ipc as ipcMain};
