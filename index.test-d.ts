/// <reference lib="dom"/>
import {expectType, expectError} from 'tsd';
import {JsonValue} from 'type-fest';
import {BrowserWindow} from 'electron';
import * as betterIpc from '.';

const mainProcessIpc: betterIpc.MainProcessIpc = betterIpc;
const window = BrowserWindow.getFocusedWindow();

expectType<Promise<JsonValue>>(
	mainProcessIpc.callRenderer(window!, 'get-emoji')
);
expectType<Promise<JsonValue>>(
	mainProcessIpc.callRenderer(window!, 'get-emoji', 'unicorn')
);

const detachListener = mainProcessIpc.answerRenderer('get-emoji', emojiName => {
	expectType<JsonValue | undefined>(emojiName);
	return '🦄';
});
mainProcessIpc.answerRenderer('get-emoji', async emojiName => {
	expectType<JsonValue | undefined>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener);
detachListener();

mainProcessIpc.sendToRenderers('get-emoji');
mainProcessIpc.sendToRenderers('get-emoji', '🦄');

expectError(mainProcessIpc.callMain);

const rendererProcessIpc: betterIpc.RendererProcessIpc = betterIpc;

expectType<Promise<JsonValue>>(
	rendererProcessIpc.callMain('get-emoji', 'unicorn')
);

const detachListener2 = rendererProcessIpc.answerMain(
	'get-emoji',
	async emojiName => {
		expectType<JsonValue | undefined>(emojiName);
		return '🦄';
	}
);
rendererProcessIpc.answerMain('get-emoji', emojiName => {
	expectType<JsonValue | undefined>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener2);
detachListener();

expectError(rendererProcessIpc.callRenderer);
