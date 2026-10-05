const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const conditions = {
  0: ['Céu limpo', '☀️'], 1: ['Predominantemente limpo', '🌤️'],
  2: ['Parcialmente nublado', '⛅'], 3: ['Nublado', '☁️'],
  45: ['Nevoeiro', '🌫️'], 48: ['Nevoeiro com geada', '🌫️'],
  51: ['Garoa leve', '🌦️'], 53: ['Garoa moderada', '🌦️'], 55: ['Garoa intensa', '🌦️'],
  56: ['Garoa congelante leve', '🌨️'], 57: ['Garoa congelante intensa', '🌨️'],
  61: ['Chuva leve', '🌧️'], 63: ['Chuva moderada', '🌧️'], 65: ['Chuva forte', '🌧️'],
  66: ['Chuva congelante leve', '🌨️'], 67: ['Chuva congelante forte', '🌨️'],
  71: ['Neve leve', '❄️'], 73: ['Neve moderada', '❄️'], 75: ['Neve forte', '❄️'],
  77: ['Grãos de neve', '❄️'], 80: ['Pancadas de chuva leves', '🌦️'],
  81: ['Pancadas de chuva moderadas', '🌦️'], 82: ['Pancadas de chuva fortes', '🌧️'],
  85: ['Pancadas de neve leves', '🌨️'], 86: ['Pancadas de neve fortes', '🌨️'],
  95: ['Trovoadas', '⛈️'], 96: ['Trovoadas com granizo', '⛈️'],
  97: ['Trovoadas fortes', '⛈️'], 99: ['Trovoadas com granizo forte', '⛈️'],
};
function describeWeather(code, isDay) {
  const [description, icon] = conditions[code] || ['Condição não informada', '☁️'];
  return { description, icon: code === 0 && isDay === 0 ? '🌙' : icon };
}

function createServer({ fetchImpl = fetch } = {}) {
  const cache = new Map();
  async function readJson(url) {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Fonte indisponível');
    const body = await response.json();
    if (!body || body.error) throw new Error('Resposta inválida');
    return body;
  }
  return http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health') return send(200, { ok: true });
      if (url.pathname === '/api/weather') {
        const city = (url.searchParams.get('city') || '').trim();
        if (!city || city.length > 120) return send(400, { error: 'Informe uma cidade válida.' });
        const cacheKey = city.toLocaleLowerCase('pt-BR');
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) return send(200, cached.data);
        const locationUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
        for (const [key, value] of Object.entries({ name: city, count: 1, language: 'pt', format: 'json' }))
          locationUrl.searchParams.set(key, value);
        const locations = await readJson(locationUrl);
        const location = locations.results?.[0];
        if (!location) return send(404, { error: 'Cidade não encontrada.' });
        if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude))
          throw new Error('Coordenadas inválidas');
        const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
        for (const [key, value] of Object.entries({
          latitude: location.latitude, longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,is_day', timezone: 'auto'
        })) weatherUrl.searchParams.set(key, value);
        const body = await readJson(weatherUrl);
        const current = body.current;
        if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.relative_humidity_2m))
          throw new Error('Dados de clima inválidos');
        const data = {
          name: location.name,
          main: { temp: current.temperature_2m, humidity: current.relative_humidity_2m },
          weather: [describeWeather(current.weather_code, current.is_day)],
          source: 'Open-Meteo',
        };
        if (cache.size >= 200 && !cache.has(cacheKey)) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { data, expiresAt: Date.now() + 5 * 60 * 1000 });
        return send(200, data);
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
if (require.main === module) createServer().listen(Number(process.env.PORT || 3000), '0.0.0.0', () =>
  console.log('Previsão do tempo disponível na porta ' + (process.env.PORT || 3000)));
module.exports = { createServer, describeWeather };
