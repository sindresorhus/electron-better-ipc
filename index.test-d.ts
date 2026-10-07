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
expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji', undefined, {signal: AbortSignal.timeout(1000)}),
);
expectType<Promise<unknown>>(
	ipcMain.callFocusedRenderer('get-emoji', 'unicorn', {signal: AbortSignal.timeout(1000)}),
);
expectError(ipcMain.callRenderer(browserWindow, 'get-emoji', 'unicorn', {signal: 1}));
expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow.webContents, 'get-emoji', 'unicorn'),
);
expectError(ipcMain.callRenderer(1, 'get-emoji'));

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
ipcMain.answerRenderer<string, string>('get-emoji', async (emojiName, senderWindow) => {
	expectType<string>(emojiName);
	expectType<BrowserWindow | undefined>(senderWindow);
	return '🦄';
});
expectError(ipcMain.answerRenderer(browserWindow, 'get-emoji', async () => '🦄'));

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

expectType<Promise<unknown>>(
	ipcRenderer.callRenderer(1, 'get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcRenderer.callRenderer<string, string>(1, 'get-emoji', 'unicorn', {signal: AbortSignal.timeout(1000)}),
);
expectError(ipcRenderer.callRenderer(browserWindow, 'get-emoji'));
expectError(ipcRenderer.callRenderer(1, 'get-emoji', 'unicorn', {signal: 1}));

expectType<() => void>(ipcRenderer.answerRenderer<string, string>('get-emoji', (emojiName, webContentsId) => {
	expectType<string>(emojiName);
	expectType<number>(webContentsId);
	return '🦄';
}));

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
	'set-zoom'(zoom?: number): void;
};

type RendererToRendererChannels = {
	'get-selection'(): string;
	'set-selection'(selection: string): boolean;
};

type Channels = {
	main: MainChannels;
	renderer: RendererChannels;
	rendererToRenderer: RendererToRendererChannels;
};

const typedIpcMain: TypedMainProcessIpc<Channels> = ipcMain;
const typedIpcRenderer: TypedRendererProcessIpc<Channels> = ipcRenderer;

expectType<Promise<string>>(typedIpcMain.callRenderer(browserWindow, 'get-title'));
expectType<Promise<string>>(typedIpcMain.callRenderer(browserWindow.webContents, 'get-title'));
expectType<Promise<string>>(typedIpcMain.callFocusedRenderer('get-title'));
expectError(typedIpcMain.callRenderer(browserWindow, 'get-emoji'));
expectError(typedIpcMain.callRenderer(browserWindow, 'get-selection'));
expectError(typedIpcMain.callFocusedRenderer('get-title', 'unicorn'));
expectType<Promise<boolean>>(typedIpcMain.callRenderer(browserWindow, 'set-title', 'Unicorn'));
expectError(typedIpcMain.callFocusedRenderer('set-title', 1));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-title'));

const signal = AbortSignal.timeout(1000);
expectType<Promise<string>>(typedIpcMain.callRenderer(browserWindow, 'get-title', undefined, {signal}));
expectType<Promise<string>>(typedIpcMain.callFocusedRenderer('get-title', undefined, {signal}));
expectType<Promise<boolean>>(typedIpcMain.callRenderer(browserWindow, 'set-title', 'Unicorn', {signal}));
expectType<Promise<boolean>>(typedIpcMain.callFocusedRenderer('set-title', 'Unicorn', {}));
expectError(typedIpcMain.callFocusedRenderer('get-title', {signal}));
expectError(typedIpcMain.callFocusedRenderer('get-title', 'unicorn', {signal}));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-title', undefined, {signal}));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-title', 1, {signal}));
expectType<Promise<void>>(typedIpcMain.callRenderer(browserWindow, 'set-zoom', 1, {signal}));
expectType<Promise<void>>(typedIpcMain.callRenderer(browserWindow, 'set-zoom', undefined, {signal}));
expectType<Promise<void>>(typedIpcMain.callRenderer(browserWindow, 'set-zoom'));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-zoom', {signal}));
expectError(typedIpcMain.callRenderer(browserWindow, 'set-title', 'Unicorn', {signal: 1}));
expectError(typedIpcMain.callRenderer(browserWindow, 'get-title', undefined, {signal}, 1));

const forwardedOptions: {signal?: AbortSignal} | undefined = Math.random() > 0.5 ? {signal} : undefined;
expectType<Promise<boolean>>(typedIpcMain.callFocusedRenderer('set-title', 'Unicorn', forwardedOptions));

type RendererArgumentsWithOptions = ['get-title', undefined, {signal: AbortSignal}] | ['set-title', string, {signal: AbortSignal}];
const rendererArgumentsWithOptions: RendererArgumentsWithOptions = Math.random() > 0.5 ? ['get-title', undefined, {signal}] : ['set-title', 'Unicorn', {signal}];
expectType<Promise<string | boolean>>(typedIpcMain.callRenderer(browserWindow, ...rendererArgumentsWithOptions));

expectType<() => void>(typedIpcMain.answerRenderer('get-emoji', (emojiName, senderWindow) => {
	expectType<string>(emojiName);
	expectType<BrowserWindow | undefined>(senderWindow);
	return '🦄';
}));
typedIpcMain.answerRenderer('get-count', async () => 1);
typedIpcMain.answerRenderer('set-count', count => {
	expectType<number | undefined>(count);
});
expectError(typedIpcMain.answerRenderer('get-emoji', () => 1));
expectError(typedIpcMain.answerRenderer('get-title', () => '🦄'));
expectError(typedIpcMain.answerRenderer(browserWindow, 'get-emoji', async () => '🦄'));

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
expectError(typedIpcMain.callFocusedRenderer(rendererChannel, 'Unicorn', {signal}));
expectError(typedIpcMain.callFocusedRenderer(rendererChannel, undefined, {signal}));

// Union channels must preserve the relationship with their replies.
const mainReplyChannel = Math.random() > 0.5 ? 'get-emoji' : 'get-count';
expectError(typedIpcMain.answerRenderer(mainReplyChannel, () => 1));
expectError(typedIpcMain.answerRenderer(mainReplyChannel, async () => '🦄'));
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
typedIpcRenderer.answerMain('get-title', data => {
	expectType<undefined>(data);
	return '🦄';
});
expectError(typedIpcRenderer.answerMain('get-title', async () => 1));
expectError(typedIpcRenderer.answerMain('get-emoji', () => '🦄'));
expectError(typedIpcRenderer.answerMain('get-selection', () => '🦄'));

// Renderer to renderer uses its own channel group.
expectType<Promise<string>>(typedIpcRenderer.callRenderer(1, 'get-selection'));
expectType<Promise<boolean>>(typedIpcRenderer.callRenderer(1, 'set-selection', 'Unicorn', {signal}));
expectError(typedIpcRenderer.callRenderer(1, 'get-title'));
expectError(typedIpcRenderer.callRenderer(1, 'set-selection'));
expectError(typedIpcRenderer.callRenderer(1, 'set-selection', 1));
expectError(typedIpcRenderer.callRenderer(1, 'set-selection', 'Unicorn', {signal: 1}));
expectError(typedIpcRenderer.callRenderer(browserWindow, 'get-selection'));

expectType<Promise<string>>(typedIpcRenderer.callRenderer(1, 'get-selection', undefined, {signal}));
expectError(typedIpcRenderer.callRenderer(1, 'get-selection', 'unicorn'));
expectError(typedIpcRenderer.callRenderer(1, 'get-selection', 'unicorn', {signal}));
expectError(typedIpcRenderer.callRenderer('1', 'get-selection'));
expectError(typedIpcRenderer.callRenderer(1, 'get-selection', {signal}));
expectError(typedIpcRenderer.callMain('get-selection'));
expectError(ipcRenderer.callRenderer('1', 'get-emoji'));

const rendererToRendererChannel = Math.random() > 0.5 ? 'get-selection' : 'set-selection';
expectError(typedIpcRenderer.callRenderer(1, rendererToRendererChannel, 'Unicorn'));

const rendererToRendererArguments: ['get-selection'] | ['set-selection', string] = Math.random() > 0.5 ? ['get-selection'] : ['set-selection', 'Unicorn'];
expectType<Promise<string | boolean>>(typedIpcRenderer.callRenderer(1, ...rendererToRendererArguments));

expectType<() => void>(typedIpcRenderer.answerRenderer('set-selection', (selection, webContentsId) => {
	expectType<string>(selection);
	expectType<number>(webContentsId);
	return true;
}));
expectError(typedIpcRenderer.answerRenderer('get-selection', async () => 1));
expectError(typedIpcRenderer.answerRenderer('get-title', () => '🦄'));
expectError(typedIpcRenderer.answerRenderer('get-emoji', () => '🦄'));
expectError(typedIpcRenderer.answerRenderer(rendererToRendererChannel, () => 'Unicorn'));

expectType<Promise<any>>(typedIpcRenderer.invoke('anything'));

// Channels must take at most one data parameter.
expectError<TypedMainProcessIpc<{main: {'get-emoji'(name: string, size: number): string}}>>(ipcMain);
expectError<TypedRendererProcessIpc<{rendererToRenderer: {'get-emoji'(name: string, size: number): string}}>>(ipcRenderer);

// Unknown group names are rejected.
expectError<TypedMainProcessIpc<{mian: MainChannels}>>(ipcMain);

// Groups can be left out.
const mainOnlyIpcMain: TypedMainProcessIpc<{main: MainChannels}> = ipcMain;
const mainOnlyIpcRenderer: TypedRendererProcessIpc<{main: MainChannels}> = ipcRenderer;
const rendererOnlyIpcRenderer: TypedRendererProcessIpc<{renderer: RendererChannels}> = ipcRenderer;
expectError(mainOnlyIpcMain.callFocusedRenderer('get-title'));
expectError(mainOnlyIpcRenderer.callRenderer(1, 'get-selection'));
const rendererToRendererOnlyIpcMain: TypedMainProcessIpc<{rendererToRenderer: RendererToRendererChannels}> = ipcMain;
expectError(rendererOnlyIpcRenderer.callMain('get-emoji', 'unicorn'));
expectError(rendererToRendererOnlyIpcMain.callFocusedRenderer('get-selection'));

// Typed IPC objects must not be assignable to incompatible schemas.
type StringChannels = {foo(data: string): string};
type NumberChannels = {foo(data: number): number};
type NumberDataChannels = {foo(data: number): string};
type NumberReplyChannels = {foo(data: string): number};
type WideDataChannels = {foo(data: string | number): string};
type EquivalentStringChannels = {foo: (data: string) => Promise<string>};

const stringMainIpc: TypedMainProcessIpc<{main: StringChannels}> = ipcMain;
const stringRendererIpc: TypedRendererProcessIpc<{main: StringChannels}> = ipcRenderer;
const stringRendererMainIpc: TypedMainProcessIpc<{renderer: StringChannels}> = ipcMain;
const stringRendererRendererIpc: TypedRendererProcessIpc<{renderer: StringChannels}> = ipcRenderer;
const stringRendererToRendererIpc: TypedRendererProcessIpc<{rendererToRenderer: StringChannels}> = ipcRenderer;
const stringRendererToRendererMainIpc: TypedMainProcessIpc<{rendererToRenderer: StringChannels}> = ipcMain;

expectError<TypedMainProcessIpc<{main: NumberChannels}>>(stringMainIpc);
expectError<TypedRendererProcessIpc<{main: NumberChannels}>>(stringRendererIpc);
expectError<TypedMainProcessIpc<{renderer: NumberChannels}>>(stringRendererMainIpc);
expectError<TypedRendererProcessIpc<{renderer: NumberChannels}>>(stringRendererRendererIpc);
expectError<TypedRendererProcessIpc<{rendererToRenderer: NumberChannels}>>(stringRendererToRendererIpc);
expectError<TypedMainProcessIpc<{rendererToRenderer: NumberChannels}>>(stringRendererToRendererMainIpc);
expectError<TypedMainProcessIpc<{main: NumberDataChannels}>>(stringMainIpc);
expectError<TypedRendererProcessIpc<{main: NumberDataChannels}>>(stringRendererIpc);
expectError<TypedMainProcessIpc<{main: NumberReplyChannels}>>(stringMainIpc);
expectError<TypedRendererProcessIpc<{main: NumberReplyChannels}>>(stringRendererIpc);
expectError<TypedMainProcessIpc<{main: WideDataChannels}>>(stringMainIpc);
expectError<TypedRendererProcessIpc<{main: WideDataChannels}>>(stringRendererIpc);
expectError<TypedMainProcessIpc<{renderer: WideDataChannels}>>(stringRendererMainIpc);
expectError<TypedRendererProcessIpc<{renderer: WideDataChannels}>>(stringRendererRendererIpc);
expectError<TypedRendererProcessIpc<{rendererToRenderer: WideDataChannels}>>(stringRendererToRendererIpc);
expectError<TypedRendererProcessIpc<{renderer: StringChannels}>>(stringRendererToRendererIpc);

expectAssignable<TypedMainProcessIpc<{main: EquivalentStringChannels}>>(stringMainIpc);
expectAssignable<TypedRendererProcessIpc<{main: EquivalentStringChannels}>>(stringRendererIpc);
expectAssignable<TypedMainProcessIpc<{renderer: EquivalentStringChannels}>>(stringRendererMainIpc);
expectAssignable<TypedRendererProcessIpc<{renderer: EquivalentStringChannels}>>(stringRendererRendererIpc);
expectAssignable<TypedRendererProcessIpc<{rendererToRenderer: EquivalentStringChannels}>>(stringRendererToRendererIpc);
