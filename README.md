# Previsão do Tempo

Aplicação em HTML, CSS e JavaScript para consultar temperatura, condição do tempo e umidade por cidade. O servidor Node.js usa a busca de localidades e os dados atuais do Open-Meteo, sem chave de API.

## Executar

Requer Node.js 20.6 ou superior.

```bash
npm start
```

Abra `http://localhost:3000`. Nenhum cadastro ou arquivo `.env` é necessário. A porta pode ser definida por `PORT`.

## Publicar no Render

O arquivo `render.yaml` prepara um serviço Node.js no plano Free. Use **New > Blueprint**, selecione este repositório e confira o plano Free antes de publicar.

Para criação manual de um Web Service, use:

| Campo | Valor |
|---|---|
| Language | Node |
| Build Command | `npm install --ignore-scripts` |
| Start Command | `node server.js` |
| Health Check Path | `/api/health` |
| Compute | Free |

Não configure `OPENWEATHER_API_KEY`: ela não é utilizada. A porta é fornecida pelo Render. O plano gratuito pode suspender o serviço após inatividade; consulte os [limites do Render](https://render.com/docs/free).

## Dados e limitações

- [Open-Meteo](https://open-meteo.com/en/docs): condições atuais estimadas por modelos meteorológicos, não necessariamente medições de uma estação local.
- [GeoNames](https://www.geonames.org/): base das localidades retornadas pela busca.
- A aplicação usa o primeiro resultado para o nome da cidade. Nomes iguais em diferentes regiões podem retornar uma localidade diferente da desejada.
- Respostas de clima são guardadas por cinco minutos em memória, com limite de 200 cidades.
- A API gratuita do Open-Meteo destina-se a uso não comercial, adequado a este portfólio. Confira [condições e limites](https://open-meteo.com/en/pricing) antes de uso comercial.

## Testes

```bash
npm test
```

Oito testes verificam busca, tradução dos códigos de tempo, dados ausentes, cache e falhas da fonte sem depender da API real. O GitHub Actions executa a suíte automaticamente.

## Segurança

A aplicação não usa mais a chave OpenWeather anteriormente publicada. Essa chave continua no histórico do Git; sua revogação no serviço continua recomendada.

## Autor

[João Medeiros](https://github.com/jmmedeiross)
