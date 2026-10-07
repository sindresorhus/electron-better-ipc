import {ipcRenderer as rawIpcRenderer} from 'electron';
import {ipcRenderer as ipc} from '../../index.js';
import {callChannel} from '../../source/util.js';

// Simulates a compromised renderer that replies with something other than an object. It runs before the handler of this module.
rawIpcRenderer.prependListener(callChannel, (event, {channel}) => {
	if (channel === 'test-hostile-reply') {
		event.ports[0].postMessage(null);
	}
});

ipc.answerRenderer('test-peer', (data, webContentsId) => `test-peer:peer:answer:${data}:${webContentsId}`);

ipc.answerRenderer('test-peer-error', () => {
	const error = new Error('test-peer-error:peer:message');
	error.code = 'test-peer-error:peer:code';
	throw error;
});

ipc.answerRenderer('test-peer-never', () => new Promise(() => {}));

ipc.answerRenderer('test-peer-delay', async ({value, delay}) => {
	await new Promise(resolve => {
		setTimeout(resolve, delay);
	});

	return value;
});

ipc.answerMain('test-peer-main-only', () => 'test-peer-main-only:peer:answer');

ipc.answerMain('test-never', () => new Promise(() => {}));

ipc.answerMain('call-peer', webContentsId => ipc.callRenderer(webContentsId, 'test-peer', 'from-peer'));

ipc.answerMain('call-main', channel => ipc.callMain(channel));
