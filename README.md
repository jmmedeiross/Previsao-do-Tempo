# Previsão do Tempo

Aplicação em HTML, CSS e JavaScript para buscar temperatura, descrição e umidade por cidade. Um servidor Node.js consulta o OpenWeather sem enviar a chave ao navegador.

## Executar

Requer Node.js 20.6 ou superior.

1. Copie `.env.example` para `.env`.
2. Preencha `OPENWEATHER_API_KEY` com uma chave nova.
3. Execute `npm start` e abra `http://localhost:3000`.

A aplicação agora exige o servidor Node.js. Para publicar, use uma hospedagem que execute Node e configure a chave como variável de ambiente; GitHub Pages sozinho não executa esse servidor.

## Publicar no Render

O arquivo `render.yaml` prepara um serviço Node.js no plano Free. A chave não fica no repositório: o Render solicita `OPENWEATHER_API_KEY` durante a criação do serviço.

1. Revogue a chave antiga e gere uma chave nova no OpenWeather.
2. Acesse o [Render](https://dashboard.render.com/) e escolha **New > Blueprint**.
3. Selecione este repositório e a branch `main`.
4. Confira o plano **Free** e informe a nova chave no campo privado `OPENWEATHER_API_KEY`.
5. Após o deploy, abra a URL criada pelo Render e faça uma busca por cidade.

A configuração usa `node server.js` para iniciar e `/api/health` para verificar o servidor. A porta é fornecida automaticamente pelo Render. Não é necessário criar um arquivo `.env` na hospedagem.

O plano Free pode suspender o serviço após inatividade e levar algum tempo para responder na próxima visita. Confira os limites na [documentação do Render](https://render.com/docs/free).

## Segurança

A chave anteriormente publicada precisa ser revogada no OpenWeather. A remoção do código atual não elimina a chave do histórico do Git. `.env` não deve ser versionado.

## Testes

Execute `npm test`. Os testes cobrem consulta, cidade inexistente, configuração ausente e falhas da fonte usando respostas simuladas, sem consumir a API real.

## Autor

[João Medeiros](https://github.com/jmmedeiross)
