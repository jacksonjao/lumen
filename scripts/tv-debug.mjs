// Controla la app en el TV por el depurador remoto (requiere `sdb forward tcp:9333 ...`).
// Uso: node scripts/tv-debug.mjs shot salida.png
//      node scripts/tv-debug.mjs keys Right,Right,Down [salida.png]
//      node scripts/tv-debug.mjs eval "expresión JS"
const PORT = process.env.TV_DEBUG_PORT || 9333;
const [cmd, arg, out] = process.argv.slice(2);
const CODES = { Left: 37, Up: 38, Right: 39, Down: 40, Enter: 13, Back: 10009 };

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((r) => {
    const my = ++id;
    pending.set(my, r);
    ws.send(JSON.stringify({ id: my, method, params }));
    setTimeout(() => { if (pending.delete(my)) r({ error: method + ': sin respuesta' }); }, 15000);
});
// Lanzada en modo debug, la app espera al depurador antes de ejecutar nada.
await send('Runtime.runIfWaitingForDebugger');
await send('Debugger.enable');
await send('Debugger.resume');
await send('Debugger.disable');
const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : r;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (file) => {
    await send('Page.enable');
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (!r.result) { console.log('captura falló:', JSON.stringify(r)); return; }
    const fs = await import('node:fs');
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    console.log('captura:', file);
};

if (cmd === 'shot') await shot(arg);
if (cmd === 'eval') console.log(JSON.stringify(await evaluate(arg), null, 1));
if (cmd === 'keys') {
    for (const k of arg.split(',')) {
        const code = CODES[k];
        await evaluate(`['keydown','keyup'].forEach(function(t){document.dispatchEvent(new KeyboardEvent(t,{bubbles:true}));});0`.replace(
            'new KeyboardEvent(t,{bubbles:true})',
            `(function(){var e=document.createEvent('Event');e.initEvent(t,true,true);e.keyCode=${code};return e;})()`));
        await sleep(450);
    }
    await sleep(900);
    if (out) await shot(out);
}
ws.close();
process.exit(0);
