function colocarDadosNaTela(dados) {
  document.querySelector(".temp-cidade").textContent = "Tempo em " + dados.name;
  document.querySelector(".temp").textContent = Math.floor(dados.main.temp) + "°C";
  document.querySelector(".texto-previsao").textContent = dados.weather[0].description;
  document.querySelector(".umidade").textContent = "Umidade: " + dados.main.humidity + "%";
  document.querySelector(".img-previsao").src =
    "https://openweathermap.org/img/wn/" + encodeURIComponent(dados.weather[0].icon) + ".png";
}
let requestVersion = 0;
async function buscarCidade(cidade) {
  const version = ++requestVersion;
  const status = document.querySelector("#status");
  cidade = cidade.trim();
  if (!cidade) { status.textContent = "Digite o nome de uma cidade."; return; }
  status.textContent = "Buscando...";
  try {
    const resposta = await fetch("/api/weather?city=" + encodeURIComponent(cidade));
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.error || "Não foi possível consultar o clima.");
    if (version !== requestVersion) return;
    colocarDadosNaTela(dados);
    status.textContent = "";
  } catch (error) {
    if (version === requestVersion) status.textContent = error.message;
  }
}
function cliqueiNoBotao() {
  buscarCidade(document.querySelector(".input-cidade").value);
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".input-cidade").addEventListener("keydown", event => {
    if (event.key === "Enter") cliqueiNoBotao();
  });
});
