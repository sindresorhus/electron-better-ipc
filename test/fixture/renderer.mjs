import {ipcRenderer as rawIpcRenderer} from 'electron';
import {ipcRenderer as ipc} from '../../index.js';
import {ipcRenderer as ipcCopy} from '../../source/renderer.js?copy';
import {forwardChannel} from '../../source/util.js';

const log = message => {
	rawIpcRenderer.send('log', message);
};

const logError = async (name, promise) => {
	try {
		log(`${name}:renderer:unexpected-answer: ${await promise}`);
	} catch (error) {
		log(`${name}:renderer:error: ${error.message}`);
	}
};

const logThrow = (name, function_) => {
	try {
		function_();
		log(`${name}:renderer:unexpected-success`);
	} catch (error) {
		log(`${name}:renderer:error: ${error.message}`);
	}
};

const callsToMain = [
	ipc.callMain('test', 'optional-data').then(answer => {
		log('test:renderer:answer-from-main: ' + answer);
	}),
	ipc.callMain('test-error').catch(error => {
		log('test-error:renderer:from-main:is-error ' + (error instanceof Error));
		log('test-error:renderer:from-main:error-message ' + error.message);
	}),
	ipc.callMain('test-focused', 'optional-data').then(answer => {
		log('test-focused:renderer:answer-from-main: ' + answer);
	}),
	ipc.callMain('test-concurrency', 'data-1').then(answer => {
		log('test-concurrency:renderer:answer-from-main-1: ' + answer);
	}),
	ipc.callMain('test-concurrency', 'data-2').then(answer => {
		log('test-concurrency:renderer:answer-from-main-2: ' + answer);
	}),
];

ipc.answerMain('test', data => {
	log('test:renderer:data-from-main: ' + data);
	return 'test:renderer:answer-data';
});

ipc.answerMain('test-focused', data => {
	log('test-focused:renderer:data-from-main: ' + data);
	return 'test-focused:renderer:answer-data';
});

ipc.answerMain('test-signal-answered', () => 'test-signal-answered:renderer:answer-data');

ipc.answerMain('test-never', () => new Promise(() => {}));

logThrow('test-duplicate', () => {
	ipc.answerMain('test', () => {});
});

ipc.answerRenderer('test-duplicate-renderer', () => {});
logThrow('test-duplicate-renderer', () => {
	ipc.answerRenderer('test-duplicate-renderer', () => {});
});

const removeHandler = ipc.answerMain('test-removed', () => {});
removeHandler();

// A stale remove function does not remove a later registration of the same callback.
const reregisteredCallback = () => 'test-reregistered:renderer:answer';
const removeStaleHandler = ipc.answerMain('test-reregistered', reregisteredCallback);
removeStaleHandler();
ipc.answerMain('test-reregistered', reregisteredCallback);
removeStaleHandler();

ipc.answerMain('test-not-cloneable', () => () => {});

// Another copy of the module shares the handlers and does not answer twice.
ipcCopy.answerMain('test-copy', data => {
	log('test-copy:renderer:data-from-main: ' + data);
	return 'test-copy:renderer:answer';
});

logThrow('test-copy-duplicate', () => {
	ipcCopy.answerMain('test', () => {});
});

rawIpcRenderer.once('test-peer', async () => {
	const {mainId, peerId, peerToCloseId, viewId} = await ipc.callMain('get-web-contents-ids');

	const answer = await ipc.callRenderer(peerId, 'test-peer', 'data-1');
	log('test-peer:renderer:answer: ' + answer.replace(`:${mainId}`, ':<main-id>'));

	const viewAnswer = await ipc.callRenderer(viewId, 'test-peer', 'data-2');
	log('test-peer-view:renderer:answer: ' + viewAnswer.replace(`:${mainId}`, ':<main-id>'));

	try {
		await ipc.callRenderer(peerId, 'test-peer-error');
	} catch (error) {
		log(`test-peer-error:renderer:error: ${error instanceof Error} ${error.message} ${error.code}`);
	}

	// `answerMain` handlers are not reachable from other renderers.
	await logError('test-peer-main-only', ipc.callRenderer(peerId, 'test-peer-main-only'));
	await logError('test-peer-missing-id', ipc.callRenderer(999, 'test-peer'));
	await logError('test-peer-invalid-id', ipc.callRenderer('1', 'test-peer'));
	await logError('test-peer-channel', ipc.callRenderer(peerId, ''));

	await logError('test-peer-signal-aborted', ipc.callRenderer(peerId, 'test-peer', undefined, {signal: AbortSignal.abort(new Error('test-peer-signal-aborted:renderer:reason'))}));

	try {
		await ipc.callRenderer(peerId, 'test-peer-never', undefined, {signal: AbortSignal.timeout(100)});
	} catch (error) {
		log('test-peer-signal:renderer:error: ' + error.name);
	}

	// Each call has its own reply port, so replies that arrive out of order go to the right caller.
	const delayedAnswers = await Promise.all([
		ipc.callRenderer(peerId, 'test-peer-delay', {value: 'first', delay: 100}),
		ipc.callRenderer(peerId, 'test-peer-delay', {value: 'second', delay: 0}),
	]);
	log('test-peer-concurrency:renderer:answer: ' + delayedAnswers.join(','));

	// A compromised renderer cannot fake the sender ID.
	const {port1, port2} = new MessageChannel();
	const spoofedReply = new Promise(resolve => {
		port1.addEventListener('message', ({data}) => {
			resolve(data);
		});
	});
	port1.start();
	rawIpcRenderer.postMessage(forwardChannel, {webContentsId: peerId, channel: 'test-peer', data: 'spoofed', senderId: 4242}, [port2]);
	log('test-peer-spoofed-sender:renderer:answer: ' + (await spoofedReply).value.replace(`:${mainId}`, ':<main-id>'));

	// Malformed messages on the forward channel do not crash the main process.
	rawIpcRenderer.send(forwardChannel, {webContentsId: peerId, channel: 'test-peer'});
	rawIpcRenderer.postMessage(forwardChannel, null, [new MessageChannel().port2]);
	log('test-peer-malformed:renderer:answer: ' + await ipc.callRenderer(peerId, 'test-peer-delay', {value: 'still-works', delay: 0}));

	// The call rejects when the target reloads or closes before answering.
	const reloadedCall = ipc.callRenderer(peerId, 'test-peer-never');
	await ipc.callMain('reload-peer-window');
	await logError('test-peer-reload', reloadedCall);

	const closedCall = ipc.callRenderer(peerToCloseId, 'test-peer-never');
	await ipc.callMain('close-peer-window');
	await logError('test-peer-close', closedCall);

	await Promise.all(callsToMain);
	rawIpcRenderer.send('done');
});
