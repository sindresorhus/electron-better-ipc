import {BrowserWindow} from 'electron';
import {expectType, expectError, expectAssignable} from 'tsd';
import {
	ipcMain,
	ipcRenderer,
	type TypedMainProcessIpc,
	type TypedRendererProcessIpc,
} from './index.js';

const browserWindow = BrowserWindow.getFocusedWindow()!;

// IpcMain

expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji'),
);
expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<unknown>>(
	ipcMain.callRenderer<string>(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcMain.callRenderer<string, string>(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji', 'unicorn'),
);

const detachListener = ipcMain.answerRenderer('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer('get-emoji', async emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string>('get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string, string>('get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string, string>(browserWindow, 'get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener);
detachListener();

ipcMain.sendToRenderers('get-emoji');
ipcMain.sendToRenderers('get-emoji', '🦄');
ipcMain.sendToRenderers<string>('get-emoji', '🦄');

expectError(ipcMain.callMain);

// IpcRenderer

expectType<Promise<unknown>>(
	ipcRenderer.callMain('get-emoji', 'unicorn'),
);
expectType<Promise<unknown>>(
	ipcRenderer.callMain<string>('get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcRenderer.callMain<string, string>('get-emoji', 'unicorn'),
);

const detachListener2 = ipcRenderer.answerMain(
	'get-emoji',
	async emojiName => {
		expectType<unknown>(emojiName);
		return '🦄';
	},
);
ipcRenderer.answerMain('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcRenderer.answerMain<string>('get-emoji', emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcRenderer.answerMain<string, string>('get-emoji', emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener2);
detachListener2();

expectError(ipcRenderer.callRenderer);

// Typed channels

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface MainChannels {
	'get-emoji'(name: string): string;
	'get-count'(): Promise<number>;
	'set-count'(count?: number): void;
}

type RendererChannels = {
	'get-title'(): string;
	'set-title': (title: string) => boolean;
};

const typedIpcMain: TypedMainProcessIpc<MainChannels, RendererChannels> = ipcMain;
const typedIpcRenderer: TypedRendererProcessIpc<MainChannels, RendererChannels> = ipcRenderer;

expectType<Promise<string>>(typedIpcMain.callRenderer(browserWindow, 'get-title'));
expectType<Promise<string>>(typedIpcMain.callFocusedRenderer('get-title'));
expectError(typedIpcMain.callRenderer(browserWindow, 'get-emoji'));
expectError(typedIpcMain.callFocusedRenderer('get-title', 'unicorn'));
expectType<Promise<boolean>>(typedIpcMain.callRenderer(browserWindow, 'set-title', 'Unicorn'));
expectError(typedIpcMain.callFocusedRenderer('set-title', 1));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-title'));

expectType<() => void>(typedIpcMain.answerRenderer('get-emoji', (emojiName, senderWindow) => {
	expectType<string>(emojiName);
	expectType<BrowserWindow>(senderWindow);
	return '🦄';
}));
typedIpcMain.answerRenderer('get-count', async () => 1);
typedIpcMain.answerRenderer('set-count', count => {
	expectType<number | undefined>(count);
});
typedIpcMain.answerRenderer(browserWindow, 'get-emoji', async (emojiName, senderWindow) => {
	expectType<string>(emojiName);
	expectType<BrowserWindow>(senderWindow);
	return '🦄';
});
expectError(typedIpcMain.answerRenderer('get-emoji', () => 1));
expectError(typedIpcMain.answerRenderer('get-title', () => '🦄'));
expectError(typedIpcMain.answerRenderer(browserWindow, 'get-count', async () => '1'));
expectError(typedIpcMain.answerRenderer(browserWindow, 'get-title', () => '🦄'));

typedIpcMain.sendToRenderers('anything', 1);
typedIpcMain.handle('anything', () => '🦄');

expectType<Promise<string>>(typedIpcRenderer.callMain('get-emoji', 'unicorn'));
expectType<Promise<number>>(typedIpcRenderer.callMain('get-count'));
expectType<Promise<void>>(typedIpcRenderer.callMain('set-count'));
expectType<Promise<void>>(typedIpcRenderer.callMain('set-count', 1));
expectError(typedIpcRenderer.callMain('get-title'));
expectError(typedIpcRenderer.callMain('get-emoji'));
expectError(typedIpcRenderer.callMain('get-emoji', 1));
expectError(typedIpcRenderer.callMain('get-count', 1));

// Union channels must preserve the relationship with their payloads.
const mainChannel = Math.random() > 0.5 ? 'get-emoji' : 'set-count';
expectError(typedIpcRenderer.callMain(mainChannel, 1));
expectError(typedIpcRenderer.callMain(mainChannel));

const rendererChannel = Math.random() > 0.5 ? 'get-title' : 'set-title';
expectError(typedIpcMain.callRenderer(browserWindow, rendererChannel, 'Unicorn'));
expectError(typedIpcMain.callRenderer(browserWindow, rendererChannel));
expectError(typedIpcMain.callFocusedRenderer(rendererChannel, 'Unicorn'));
expectError(typedIpcMain.callFocusedRenderer(rendererChannel));

// Union channels must preserve the relationship with their replies.
const mainReplyChannel = Math.random() > 0.5 ? 'get-emoji' : 'get-count';
expectError(typedIpcMain.answerRenderer(mainReplyChannel, () => 1));
expectError(typedIpcMain.answerRenderer(mainReplyChannel, async () => '🦄'));
expectError(typedIpcMain.answerRenderer(browserWindow, mainReplyChannel, () => '🦄'));
expectError(typedIpcMain.answerRenderer(browserWindow, mainReplyChannel, async () => 1));
expectError(typedIpcRenderer.answerMain(rendererChannel, () => 'Unicorn'));
expectError(typedIpcRenderer.answerMain(rendererChannel, async () => true));

const mainArguments: ['get-emoji', string] | ['set-count', number?] = Math.random() > 0.5 ? ['get-emoji', 'unicorn'] : ['set-count'];
expectType<Promise<string | void>>(typedIpcRenderer.callMain(...mainArguments));

const rendererArguments: ['get-title'] | ['set-title', string] = Math.random() > 0.5 ? ['get-title'] : ['set-title', 'Unicorn'];
expectType<Promise<string | boolean>>(typedIpcMain.callRenderer(browserWindow, ...rendererArguments));
expectType<Promise<string | boolean>>(typedIpcMain.callFocusedRenderer(...rendererArguments));

expectType<() => void>(typedIpcRenderer.answerMain('get-title', () => '🦄'));
typedIpcRenderer.answerMain('set-title', title => {
	expectType<string>(title);
	return true;
});
typedIpcRenderer.answerMain('set-title', async () => true);
expectError(typedIpcRenderer.answerMain('get-title', async () => 1));
expectError(typedIpcRenderer.answerMain('get-emoji', () => '🦄'));

expectType<Promise<any>>(typedIpcRenderer.invoke('anything'));

// Channels must take at most one data parameter
expectError<TypedMainProcessIpc<{'get-emoji'(name: string, size: number): string}, RendererChannels>>(ipcMain);

// One side can have no channels
const mainOnlyIpcMain: TypedMainProcessIpc<MainChannels, Record<never, never>> = ipcMain;
const mainOnlyIpcRenderer: TypedRendererProcessIpc<MainChannels, Record<never, never>> = ipcRenderer;
const rendererOnlyIpcMain: TypedMainProcessIpc<Record<never, never>, RendererChannels> = ipcMain;
const rendererOnlyIpcRenderer: TypedRendererProcessIpc<Record<never, never>, RendererChannels> = ipcRenderer;
expectError(mainOnlyIpcMain.callFocusedRenderer('get-title'));
expectError(rendererOnlyIpcRenderer.callMain('get-emoji', 'unicorn'));

// Typed IPC objects must not be assignable to incompatible channel schemas.
type EmptyChannels = Record<never, never>;
type StringChannels = {foo(data: string): string};
type NumberChannels = {foo(data: number): number};
type NumberDataChannels = {foo(data: number): string};
type NumberReplyChannels = {foo(data: string): number};
type WideDataChannels = {foo(data: string | number): string};
type EquivalentStringChannels = {foo: (data: string) => Promise<string>};

const stringMainIpc: TypedMainProcessIpc<StringChannels, EmptyChannels> = ipcMain;
const stringRendererIpc: TypedRendererProcessIpc<StringChannels, EmptyChannels> = ipcRenderer;
const stringRendererMainIpc: TypedMainProcessIpc<EmptyChannels, StringChannels> = ipcMain;
const stringRendererRendererIpc: TypedRendererProcessIpc<EmptyChannels, StringChannels> = ipcRenderer;

expectError<TypedMainProcessIpc<NumberChannels, EmptyChannels>>(stringMainIpc);
expectError<TypedRendererProcessIpc<NumberChannels, EmptyChannels>>(stringRendererIpc);
expectError<TypedMainProcessIpc<EmptyChannels, NumberChannels>>(stringRendererMainIpc);
expectError<TypedRendererProcessIpc<EmptyChannels, NumberChannels>>(stringRendererRendererIpc);
expectError<TypedMainProcessIpc<NumberDataChannels, EmptyChannels>>(stringMainIpc);
expectError<TypedRendererProcessIpc<NumberDataChannels, EmptyChannels>>(stringRendererIpc);
expectError<TypedMainProcessIpc<NumberReplyChannels, EmptyChannels>>(stringMainIpc);
expectError<TypedRendererProcessIpc<NumberReplyChannels, EmptyChannels>>(stringRendererIpc);
expectError<TypedMainProcessIpc<WideDataChannels, EmptyChannels>>(stringMainIpc);
expectError<TypedRendererProcessIpc<WideDataChannels, EmptyChannels>>(stringRendererIpc);
expectError<TypedMainProcessIpc<EmptyChannels, WideDataChannels>>(stringRendererMainIpc);
expectError<TypedRendererProcessIpc<EmptyChannels, WideDataChannels>>(stringRendererRendererIpc);

expectAssignable<TypedMainProcessIpc<EquivalentStringChannels, EmptyChannels>>(stringMainIpc);
expectAssignable<TypedRendererProcessIpc<EquivalentStringChannels, EmptyChannels>>(stringRendererIpc);
expectAssignable<TypedMainProcessIpc<EmptyChannels, EquivalentStringChannels>>(stringRendererMainIpc);
expectAssignable<TypedRendererProcessIpc<EmptyChannels, EquivalentStringChannels>>(stringRendererRendererIpc);
