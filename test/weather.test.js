const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
test('saúde do servidor não depende de chave nem da fonte externa', async () => {
 const result = await query({ apiKey: '', fetchImpl: () => { throw new Error('Não deveria consultar'); } }, '/api/health');
 assert.equal(result.status, 200);
 assert.deepEqual(result.data, { ok: true });
});
async function query(options, route = '/api/weather?city=São%20Paulo') {
 const server = createServer(options);
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 try {
 const response = await fetch('http://127.0.0.1:' + server.address().port + route);
 return { status: response.status, data: await response.json() };
 } finally { await new Promise(resolve => server.close(resolve)); }
}
test('consulta mantém chave fora da resposta e codifica cidade', async () => {
 const r = await query({ apiKey: 'private-test-key', fetchImpl: async url => {
 assert.equal(url.searchParams.get('q'), 'São Paulo');
 assert.equal(url.searchParams.get('appid'), 'private-test-key');
 return { ok: true, json: async () => ({ name: 'São Paulo', main: { temp: 23, humidity: 60 }, weather: [{ description: 'céu limpo', icon: '01d' }] }) };
 }});
 assert.equal(r.status, 200); assert.equal(r.data.main.temp, 23);
 assert.ok(!JSON.stringify(r.data).includes('private-test-key'));
});
test('cidade vazia e chave ausente impedem consulta', async () => {
 const fetchImpl = () => { throw new Error('Não deveria consultar'); };
 assert.equal((await query({ apiKey: 'key', fetchImpl }, '/api/weather?city=')).status, 400);
 assert.equal((await query({ apiKey: '', fetchImpl })).status, 503);
});
test('cidade inexistente e falha externa', async () => {
 assert.equal((await query({ apiKey: 'key', fetchImpl: async () => ({ ok: false, status: 404 }) })).status, 404);
 const r = await query({ apiKey: 'key', fetchImpl: async () => { throw new Error('URL com chave privada'); } });
 assert.equal(r.status, 502); assert.ok(!JSON.stringify(r.data).includes('privada'));
});

