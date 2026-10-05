# Previsão do Tempo

Aplicação em HTML, CSS e JavaScript para buscar temperatura, descrição e umidade por cidade. Um servidor Node.js consulta o OpenWeather sem enviar a chave ao navegador.

## Executar

Requer Node.js 20.6 ou superior.

1. Copie `.env.example` para `.env`.
2. Preencha `OPENWEATHER_API_KEY` com uma chave nova.
3. Execute `npm start` e abra `http://localhost:3000`.

A aplicação agora exige o servidor Node.js. Para publicar, use uma hospedagem que execute Node e configure a chave como variável de ambiente; GitHub Pages sozinho não executa esse servidor.

## Segurança

A chave anteriormente publicada precisa ser revogada no OpenWeather. A remoção do código atual não elimina a chave do histórico do Git. `.env` não deve ser versionado.

## Testes

Execute `npm test`. Os testes cobrem consulta, cidade inexistente, configuração ausente e falhas da fonte usando respostas simuladas, sem consumir a API real.

## Autor

[João Medeiros](https://github.com/jmmedeiross)
