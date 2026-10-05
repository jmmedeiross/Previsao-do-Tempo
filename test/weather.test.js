const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer, describeWeather } = require('../server');
const location = { name: 'São Paulo', latitude: -23.55, longitude: -46.63 };
const climate = { temperature_2m: 23, relative_humidity_2m: 60, weather_code: 0, is_day: 1 };
const reply = body => ({ ok: true, json: async () => body });
async function withServer(fetchImpl, callback) {
 const server = createServer({ fetchImpl });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 try { return await callback('http://127.0.0.1:' + server.address().port); }
 finally { await new Promise(resolve => server.close(resolve)); }
}
async function query(fetchImpl, route = '/api/weather?city=São%20Paulo') {
 return withServer(fetchImpl, async base => {
  const response = await fetch(base + route);
  return { status: response.status, data: await response.json() };
 });
}
test('saúde não consulta a fonte externa', async () => {
 const r = await query(() => { throw new Error('Não deveria consultar'); }, '/api/health');
 assert.equal(r.status, 200); assert.deepEqual(r.data, { ok: true });
});
test('busca cidade com acentos e clima sem enviar chave', async () => {
 const calls = [];
 const r = await query(async url => {
  calls.push(url);
  assert.equal(url.searchParams.has('apikey'), false);
  assert.equal(url.searchParams.has('appid'), false);
  if (url.hostname === 'geocoding-api.open-meteo.com') {
   assert.equal(url.searchParams.get('name'), 'São Paulo');
   return reply({ results: [location] });
  }
  assert.equal(url.searchParams.get('latitude'), '-23.55');
  assert.ok(url.searchParams.get('current').includes('relative_humidity_2m'));
  return reply({ current: climate });
 });
 assert.equal(r.status, 200); assert.equal(calls.length, 2);
 assert.equal(r.data.main.temp, 23); assert.equal(r.data.main.humidity, 60);
 assert.equal(r.data.weather[0].description, 'Céu limpo');
});
test('cidade vazia impede consulta', async () => {
 const r = await query(() => { throw new Error('Não deveria consultar'); }, '/api/weather?city=%20');
 assert.equal(r.status, 400);
});
test('cidade inexistente não consulta previsão', async () => {
 let calls = 0;
 const r = await query(async () => { calls++; return reply({}); });
 assert.equal(r.status, 404); assert.equal(calls, 1);
});
test('falhas da fonte retornam mensagem segura', async () => {
 const network = await query(async () => { throw new Error('detalhe interno'); });
 const http = await query(async () => ({ ok: false, status: 500 }));
 assert.equal(network.status, 502); assert.equal(http.status, 502);
 assert.ok(!JSON.stringify(network.data).includes('interno'));
});
test('dados incompletos são rejeitados e valores zero preservados', async () => {
 const fixture = current => async url => reply(url.hostname.startsWith('geocoding-') ? { results: [location] } : { current });
 assert.equal((await query(fixture({}))).status, 502);
 const r = await query(fixture({ ...climate, temperature_2m: 0, relative_humidity_2m: 0 }));
 assert.equal(r.status, 200); assert.equal(r.data.main.temp, 0); assert.equal(r.data.main.humidity, 0);
});
test('códigos de condições, noite e código desconhecido', () => {
 assert.equal(describeWeather(0, 0).icon, '🌙');
 assert.equal(describeWeather(95, 1).description, 'Trovoadas');
 assert.equal(describeWeather(65, 1).description, 'Chuva forte');
 assert.equal(describeWeather(12345, 1).description, 'Condição não informada');
});
test('consultas repetidas usam cache', async () => {
 let calls = 0;
 await withServer(async url => {
  calls++; return reply(url.hostname.startsWith('geocoding-') ? { results: [location] } : { current: climate });
 }, async base => {
  for (const city of ['São Paulo', 'são paulo']) {
   const r = await fetch(base + '/api/weather?city=' + encodeURIComponent(city));
   assert.equal(r.status, 200); await r.json();
  }
 });
 assert.equal(calls, 2);
});
