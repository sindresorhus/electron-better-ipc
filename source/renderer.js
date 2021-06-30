'use strict';
const electron = require('electron');
const {serializeError, deserializeError} = require('serialize-error');
const util = require('./util.js');

const {ipcRenderer} = electron;
const ipc = Object.create(ipcRenderer || {});

ipc.callMain = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipcRenderer.off(dataChannel, onData);
		ipcRenderer.off(errorChannel, onError);
	};

	const onData = (_event, result) => {
		cleanup();
		resolve(result);
	};

	const onError = (_event, error) => {
		cleanup();
		reject(deserializeError(error));
	};

	ipcRenderer.once(dataChannel, onData);
	ipcRenderer.once(errorChannel, onError);

	const completeData = {
		dataChannel,
		errorChannel,
		userData: data
	};

	ipcRenderer.send(sendChannel, completeData);
});

ipc.answerMain = (channel, callback) => {
	const sendChannel = util.getRendererSendChannel(channel);

	const listener = async (_event, data) => {
		const {dataChannel, errorChannel, userData} = data;

		try {
			ipcRenderer.send(dataChannel, await callback(userData));
		} catch (error) {
			ipcRenderer.send(errorChannel, serializeError(error));
		}
	};

	ipcRenderer.on(sendChannel, listener);

	return () => {
		ipcRenderer.off(sendChannel, listener);
	};
};

module.exports = ipc;
