import electron from 'electron';
import {serializeError, deserializeError} from 'serialize-error';
import {getSendChannel} from './util.js';

const {ipcRenderer} = electron;
const ipc = Object.create(ipcRenderer || {});

ipc.callMain = async (channel, data) => {
	const {value, error} = await ipcRenderer.invoke(channel, data);

	if (error) {
		throw deserializeError(error);
	}

	return value;
};

ipc.answerMain = (channel, callback) => {
	const sendChannel = getSendChannel(channel);

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

export {ipc as ipcRenderer};
