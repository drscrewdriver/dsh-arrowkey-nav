# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md) | [Português](./README.pt.md)

Navegação com as teclas de seta para a GUI web do DSH. Troque de sessão sem
sair do teclado:

| Tecla | Ação | Escopo |
| --- | --- | --- |
| `↑` | sessão anterior | dentro do espaço de trabalho atual |
| `↓` | próxima sessão | dentro do espaço de trabalho atual |
| `←` | espaço de trabalho anterior | todos os espaços de trabalho |
| `→` | próximo espaço de trabalho | todos os espaços de trabalho |

`↑`/`↓` dão a volta nas extremidades do espaço de trabalho e nunca cruzam para o
vizinho; cruzar é tarefa de `←`/`→`. Depois de uma troca, a linha de destino é
rolada até ficar visível, e o foco volta à caixa de redação se foi ali que a
tecla foi pressionada, de modo que dá para continuar digitando de imediato.

## Versão e linhas do DSH

Uma única versão atende todas as linhas de host suportadas. A versão `0.5.9` é testada com todos os rc das linhas DSH 0.1.0–0.2.0 — o intervalo declarado é `engines.dsh`, distribuído pela fonte única `scripts/hosts.mjs` através de `scripts/sync-hosts.mjs` (uma edição manual faz o `npm run hosts:check` falhar):

| Linha DSH | rc testados |
| --- | --- |
| 0.1.0 | rc.2, rc.3, rc.6, rc.7, rc.8 |
| 0.1.1 | rc.1, rc.2 |
| 0.1.2 | rc.1 |
| 0.1.5 | rc.1, rc.2, rc.3 |
| 0.1.7 | rc.1, rc.2 |
| 0.2.0 | rc.1, rc.2 |

- Não há build por linha: as duas gerações de troca são despachadas por sondagem de capacidades num único bundle (`uiWorkspace.openSession` na geração 0.1.6+, `sessions.open` nas anteriores) — cada linha executa o mesmo código.
- Nas linhas 0.1.0/0.1.1 (geração `dsh-client-runtime`) a declaração e os testes unitários estão completos, mas falta a verificação das teclas em hosts reais; até lá, trate essas duas células como best effort.

## Instalação

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

O `latest` do registry é a única versão para todas as linhas. Cada linha também tem um dist-tag que aponta para o mesmo build — `dsh-arrowkey-nav@dsh-0.2.0`, `dsh-arrowkey-nav@dsh-0.1.5` etc. — se você preferir nomear a linha; o destino da instalação é idêntico. Uma versão de host fora da tabela é recusada pelo intervalo `engines.dsh` em vez de montar pela metade.

Depois reinicie o perfil — uma instância em execução não carrega a quente uma
nova camada de bundle. Em seguida, recarregue `http://127.0.0.1:3080`.

Confirme que a linha entrou na árvore composta:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

Alternativamente, dá para registrar um checkout local com
`dsh plugin --profile web add <absolute path to the checkout> -w`; veja
[INSTALL.md](./INSTALL.md) para o guia completo, incluindo atualização,
verificação e remoção.

### Remover

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

Depois de reiniciar, as teclas se comportam exatamente como antes da instalação:
o listener pertence ao efeito Cordis do plugin e sai junto com ele.

## Como funciona

A identidade vem dos dois controladores de cliente, nunca do DOM: as linhas
não carregam nem `data-*` nem `id`, então não é possível perguntar a uma linha
que sessão ela é.

- Cada troca passa pelo executor escolhido pela sondagem de capacidades: `ctx.uiWorkspace.openSession(id)` nas gerações DSH 0.1.6+, `ctx.sessions.open(id)` nas linhas anteriores — um bundle, sem build por linha. O painel de detalhes não precisa de tratamento: a moldura embutida já o fecha quando a sessão atual muda.

**Qual sessão é «a próxima» segue a ordem que a barra lateral está
desenhando**, não a ordem de membros do controlador. As duas divergem justamente no
caso que você nota: a barra lateral reconcilia a sua própria ordem persistida com a
pertença e promove as sessões recentemente ativas para o topo, de modo que uma
sessão antiga salta para a primeira linha no momento em que você a abre.
Por isso o plugin lê a ordem de linhas renderizada da barra lateral e
recorre à ordem do controlador quando a barra lateral não está montada (barra
reduzida). Uma seção só é aceita quando as suas linhas dão conta de todas as
sessões que o controlador reporta para aquele espaço de trabalho; uma seção
ambígua ou que não bate é preferível recorrer a adivinhar.

As teclas são deixadas em paz quando o evento já pertence a outra: qualquer
modificador, uma composição IME, um evento já tratado a montante, ou um foco
dentro de um diálogo, menu ou outro campo editável (a busca de sessões da
barra lateral, uma caixa de renomear). O listener é registrado na fase de
captura, mas só chama `preventDefault()` quando de fato navega.

A caixa de redação é o único caso condicional. **Uma caixa de redação
vazia cede as suas setas** — não há cursor a mover, a tecla fica livre — e é isso
que permite navegar logo depois de enviar uma mensagem, enquanto a caixa de
redação ainda mantém o foco. Assim que a caixa de redação **guarda um
rascunho, as setas voltam a ser do cursor**, então editar um prompt nunca
é sequestrado.

A metade de navegador não tem componentes React, nem CSS, nem requisições de
módulos de plataforma, e o pacote não tem dependências em tempo de execução
— `lib/client.js` é gerado por `scripts/build-client.mjs` no contrato de
module-loader que a página espera.

## Desenvolvimento

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

O `npm run build` precisa de `typescript`; se ele não estiver instalado neste pacote,
aponte `DSH_TYPESCRIPT` para um diretório de módulo `typescript` existente.

## Limitações conhecidas

- **Um grupo de espaços de trabalho recolhido não rola.** As linhas dele não estão
  montadas e o dsh não oferece forma pública de desdobrar um grupo, então a troca
  acontece, mas a linha de destino fica fora da vista. O espaço de trabalho
  que contém a sessão atual é mantido desdobrado pelo próprio dsh, de modo que
  `↑`/`↓` não são afetados.
- **Uma barra lateral reduzida também não rola**, pela mesma razão: a árvore
  não está montada. A troca ocorre do mesmo jeito.
- **O modo «numa lista só»** não tem seções por espaço de trabalho, mas
  `←`/`→` continuam percorrendo a ordem de espaços do controlador, então a
  lista pode parecer saltar entre seções.
- **A rolagem é de melhor esforço.** Qualquer falha de busca é
  engolida: a seleção já se moveu, e uma linha ausente nunca deve virar uma
  errada.
- **Os campos de instantâneo ainda não são estáveis (pre-stable).** As formas dos
  instantâneos de `sessions` e `workspaces` ainda não são estáveis — as versões de host testadas são exatamente o
  intervalo de `engines.dsh` (`engines.dsh: >=0.1.0-rc.2 <0.3.0-0`). Se uma
  atualização do dsh as mudar, `src/client/navigate.ts` e
  `src/client/apply.ts` são os únicos arquivos a revisar; um host sem nenhuma API de troca deixa o plugin inerte
  em vez de fazer a página falhar.

## Estrutura

```
src/index.ts                node half: loader entry, installs nothing
src/client/constants.ts     keys owned, DOM anchors read
src/client/navigate.ts      narrow waist: snapshot types + arrow resolver
src/client/apply.ts         execution: open / blank-first / connectWorkspace
src/client/dom.ts           read-only DOM: scroller, section binding, scroll, focus
src/client/session-nav.ts   key guards + one arrow press end to end
src/client/index.ts         Cordis entry: inject + one capturing listener
scripts/build-client.mjs    generates lib/client.js
tests/                      resolver unit tests + bundle smoke tests
```

## Licença

MIT
