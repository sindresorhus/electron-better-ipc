import electron from 'electron';
import {serializeError, deserializeError} from 'serialize-error';
import {callChannel, forwardChannel, waitForReply} from './util.js';

const {ipcRenderer} = electron;
const ipc = Object.create(ipcRenderer || {});

// Shared between copies of this module, so a handler registered by any copy answers the call.
const handlersKey = Symbol.for('electron-better-ipc.rendererHandlers');

// eslint-disable-next-line unicorn/no-global-object-property-assignment
globalThis[handlersKey] ??= {
	fromMain: new Map(),
	fromRenderer: new Map(),
};

const handlers = globalThis[handlersKey];

// Another copy of this module may already answer the calls.
if (ipcRenderer?.listenerCount(callChannel) === 0) {
	// Only calls forwarded from another renderer have a `senderId`.
	ipcRenderer.on(callChannel, async (event, {channel, data, senderId}) => {
		const [port] = event.ports;

		try {
			const handler = (senderId === undefined ? handlers.fromMain : handlers.fromRenderer).get(channel);
			if (!handler) {
				throw new Error(`No handler registered for '${channel}'`);
			}

			port.postMessage({value: await handler(data, senderId)});
		} catch (error) {
			port.postMessage({error: serializeError(error)});
		}
	});
}

const addHandler = (handlerMap, channel, callback) => {
	if (handlerMap.has(channel)) {
		throw new Error(`Attempted to register a second handler for '${channel}'`);
	}

	// A new function for each registration, so that a stale remove function does not remove a later registration of the same callback.
	const handler = (data, senderId) => callback(data, senderId);
	handlerMap.set(channel, handler);

	return () => {
		if (handlerMap.get(channel) === handler) {
			handlerMap.delete(channel);
		}
	};
};

ipc.callMain = async (channel, data) => {
	const {value, error} = await ipcRenderer.invoke(channel, data);

	if (error) {
		throw deserializeError(error);
	}

	return value;
};

ipc.answerMain = (channel, callback) => addHandler(handlers.fromMain, channel, callback);

ipc.callRenderer = async (webContentsId, channel, data, {signal} = {}) => {
	if (!Number.isSafeInteger(webContentsId)) {
		throw new TypeError('Web contents ID required');
	}

	if (typeof channel !== 'string' || channel.length === 0) {
		throw new Error('Channel required');
	}

	signal?.throwIfAborted();

	const {port1, port2} = new MessageChannel();
	ipcRenderer.postMessage(forwardChannel, {webContentsId, channel, data}, [port2]);
	return waitForReply(port1, signal);
};

ipc.answerRenderer = (channel, callback) => addHandler(handlers.fromRenderer, channel, callback);

export {ipc as ipcRenderer};
