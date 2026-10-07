import {deserializeError} from 'serialize-error';

export const callChannel = '%better-ipc-call';

export const forwardChannel = '%better-ipc-forward-call';

// Waits for the reply on a message port. The port closes when the target page goes away (closed, reloaded, or crashed), so the call rejects instead of waiting forever. Works with both the DOM `MessagePort` and Electron's `MessagePortMain`.
export const waitForReply = (port, signal) => {
	const {promise, resolve, reject} = Promise.withResolvers();

	// The DOM `MessagePort` is an `EventTarget`, while `MessagePortMain` is an `EventEmitter`.
	const listen = (port.on ?? port.addEventListener).bind(port);

	let isSettled = false;

	// `MessagePortMain#close()` emits `close` on the same port, so the first settle wins.
	const settle = (callback, value) => {
		if (isSettled) {
			return;
		}

		isSettled = true;
		signal?.removeEventListener('abort', onAbort);
		port.close();
		callback(value);
	};

	const onAbort = () => {
		settle(reject, signal.reason);
	};

	// The reply comes from another process, so do not assume its shape. A throwing listener on `MessagePortMain` would crash the main process.
	listen('message', ({data: reply}) => {
		if (reply?.error !== undefined) {
			settle(reject, deserializeError(reply.error));
			return;
		}

		settle(resolve, reply?.value);
	});

	listen('close', () => {
		settle(reject, new Error('Page closed, reloaded, or crashed before answering'));
	});

	port.start();
	signal?.addEventListener('abort', onAbort, {once: true});

	return promise;
};
