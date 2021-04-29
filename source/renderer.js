'use strict';
const electron = require('electron');
const {serializeError, deserializeError} = require('serialize-error');
const util = require('./util');

const {ipcRenderer} = electron;
const ipc = Object.create(ipcRenderer || {});

ipc.callMain = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipc.off(dataChannel, onData);
		ipc.off(errorChannel, onError);
	};

	const onData = (_event, result) => {
		cleanup();
		resolve(result);
	};

	const onError = (_event, error) => {
		cleanup();
		reject(deserializeError(error));
	};

	ipc.once(dataChannel, onData);
	ipc.once(errorChannel, onError);

	const completeData = {
		dataChannel,
		errorChannel,
		userData: data
	};

	ipc.send(sendChannel, completeData);
});

ipc.answerMain = (channel, callback) => {
	const sendChannel = util.getRendererSendChannel(channel);

	const listener = async (_event, data) => {
		const {dataChannel, errorChannel, userData} = data;

		try {
			ipc.send(dataChannel, await callback(userData));
		} catch (error) {
			ipc.send(errorChannel, serializeError(error));
		}
	};

	ipc.on(sendChannel, listener);

	return () => {
		ipc.off(sendChannel, listener);
	};
};

module.exports = ipc;
