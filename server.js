const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

function createServer({ apiKey = process.env.OPENWEATHER_API_KEY, fetchImpl = fetch } = {}) {
  return http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/weather') {
        const city = (url.searchParams.get('city') || '').trim();
        if (!city || city.length > 120) return send(400, { error: 'Informe uma cidade válida.' });
        if (!apiKey) return send(503, { error: 'Configure a chave de clima no servidor.' });
        const upstream = new URL('https://api.openweathermap.org/data/2.5/weather');
        for (const [key, value] of Object.entries({ q: city, appid: apiKey, lang: 'pt_br', units: 'metric' }))
          upstream.searchParams.set(key, value);
        const response = await fetchImpl(upstream, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) return send(response.status === 404 ? 404 : 502, {
          error: response.status === 404 ? 'Cidade não encontrada.' : 'Serviço de clima indisponível.'
        });
        const data = await response.json();
        if (!data.main || !Array.isArray(data.weather) || !data.weather.length)
          return send(502, { error: 'Resposta inválida do serviço de clima.' });
        return send(200, { name: data.name, main: { temp: data.main.temp, humidity: data.main.humidity },
          weather: [{ description: data.weather[0].description, icon: data.weather[0].icon }] });
      }
      const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'],
        '/script.js': ['script.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
      const file = files[url.pathname];
      if (!file) return send(404, { error: 'Não encontrado.' });
      const content = await fs.readFile(path.join(__dirname, file[0]));
      res.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8' });
      res.end(content);
    } catch {
      send(502, { error: 'Não foi possível consultar o clima. Tente novamente.' });
    }
  });
}
if (require.main === module) createServer().listen(Number(process.env.PORT || 3000), () =>
  console.log('Previsão do tempo disponível em http://localhost:' + (process.env.PORT || 3000)));
module.exports = { createServer };
