# Tabelionato de Protestos de Ijuí

Site institucional do Tabelionato de Protestos de Ijuí/RS — HTML, CSS e JavaScript puros (sem dependências de build).

## Estrutura

```
index.html        Página única (hero, sobre, serviços, galeria, localização, contato)
css/styles.css     Estilos, paleta de cores e animações
js/main.js         Interações: menu mobile, scroll reveal, lightbox da galeria, formulário
assets/img/        Fotos do tabelionato e logo (selo institucional)
```

## Como visualizar localmente

Qualquer servidor estático funciona, por exemplo:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Observação sobre dados de contato

Telefone, e-mail e CEP exibidos no site foram lidos diretamente das fotos da fachada
(sinalização do próprio prédio). Vale conferir esses dados antes da publicação, pois
parte do texto aparecia refletido/desfocado no vidro.
