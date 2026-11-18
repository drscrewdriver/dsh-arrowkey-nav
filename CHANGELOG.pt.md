# Registro de mudanças

0.5.5: adendo de enumeração de hosts para DSH 0.2.1-rc.3 (release apenas de declaração; plano de contrato com diff zero).

## 0.5.4 (2026-10-18)

- hosts: acrescentada a enumeração de declaração para 0.2.1-rc.2 (os 34 peer hosts `deepseek-ai/*` conferidos pacote por pacote no npm; este plugin não toca o provider `ctx.web` nem o slot `conversation.input.model.label`, zero mudança de código, release puramente de metadados; a célula rc.2 da fazenda fica de prontidão)
- i18n: acrescenta o locale português (pt-BR) — metadados do pacote e espelhos README/INSTALL/CHANGELOG.

## 0.5.2 — reedição de 0.5.1, sem mudanças de código

### Nota

- Código idêntico ao de 0.5.1 (a correção da falha de contexto estrito); reempacotado para que o pacote realmente traga as suas entradas de changelog — o tarball de 0.5.1 foi empacotado antes de elas serem confirmadas. Verificado num host real 0.1.7-rc.2 (ativação + pipeline completo de teclas) e no desktop 0.2.0-rc.2 (boot restaurado, ↑/↓ funcionando).

## 0.5.1 — corrigido o fatal de inicialização web introduzido no 0.5.0

### Corrigido

- Nos hosts atuais, o 0.5.0 podia fazer falhar a inicialização inteira (`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed`): o proxy de contexto do runner moderno **lança exceção** quando um plugin lê um serviço que o seu fiber não declarou, e o 0.5.0 lia `uiWorkspace` (log de adjunção do listener, acessora de diagnóstico, sondagem do executor) depois de tê-lo removido do `inject` do bundle. A exceção dentro do primeiro effect falhava o fiber, e a porta do web-boot trata um entry falho como fatal. O 0.5.1 volta a declarar os três serviços — `uiWorkspace` existe em todo host desde a geração 0.1.2 — e o lê apenas pela sonda segura `probeService`. As gerações 0.1.0/0.1.1 nunca registram `uiWorkspace`; ali o fiber fica pendente e o plugin inerte. Para essas duas linhas serve o legacy `dsh-arrowkey-nav@0.1.1`.

## 0.5.0 — uma versão para todas as linhas de host suportadas

### Mudanças

- **Uma única versão atende agora as seis linhas de host (0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.7, 0.2.0) — todos os rc publicados de cada uma.** Os ramos `compat/*` por linha e os builds por linha são aposentados em favor de um único bundle; os dist-tags de linha (`dsh-0.1.0` … `dsh-0.2.0`) permanecem e todos apontam para esta versão. A lista branca exata mora em `scripts/hosts.mjs` e `scripts/sync-hosts.mjs --write` a distribui para `engines.dsh` (package.json + dsh.plugin.json), `peerDependencies` e os READMEs; uma edição manual faz o `npm run hosts:check` falhar.
- `peerDependencies` agora são OBRIGATÓRIAS (os marcadores `optional` desaparecem): um host não testado faz a instalação falhar de forma ruidosa em vez de montar com um serviço silenciosamente ausente. Os dois peers de controladores listam as suas 8 versões existentes — `@deepseek-ai/dsh-api-{session,workspace}-controller` apareceu com 0.1.2-rc.1, então as gerações 0.1.0/0.1.1 ficam cobertas apenas por `engines.dsh`; `@deepseek-ai/dsh-client-ui-workspace` lista as 15.
- O bundle do cliente não espera mais o serviço `uiWorkspace` (`inject` agora é `['sessions', 'workspaces']`): as gerações 0.1.0/0.1.1 podem nunca registrá-lo, e esperar deixaria o plugin PENDING para sempre ali. Ele é sondado a cada pressionamento de tecla.

### Corrigido (por desenho, em todas as linhas)

- Uma única base de código atende ambas as gerações de troca por sondagem de capacidades (`src/client/apply.ts`, `switchExecutor`): `uiWorkspace.openSession` onde existe (0.1.6+), o antigo `sessions.open` caso contrário (0.1.0–0.1.5); um host sem nenhuma fica montado mas inerte. A sessão selecionada é lida por uma união de gerações (`src/client/navigate.ts`, `toNavState`): vence o `current` próprio do instantâneo (anterior a 0.1.6) e, na ausência, a derivação `retainedBy.mainView` (0.1.7/0.2.0). A divergência de comportamento entre linhas é impossível por construção — a classe de regressão por trás dos 0.3.x/0.4.x.

### Conhecido

- A matriz de verificação em nível de teclas (`--serve` + Playwright, uma célula por rc) continua sendo a porta de saída; esta entrada chega apenas com cobertura de unit + bundle. As células 0.1.0/0.1.1 dependem além disso de essas gerações tolerarem a tabela de módulos `dsh.client.inject` de três entradas (a sua própria geração de plugin é anterior a dois dos três pacotes).

## 0.4.1 — `compat/0.2.0` (linha DSH 0.2.0)

### Corrigido

- Restaurada a navegação com as teclas de seta no DSH 0.2.0-rc.2 (e 0.1.7-rc.2 na linha irmã `compat/0.1.7`, ali publicada como 0.3.4). Duas mudanças quebradoras da API cliente do host haviam desativado silenciosamente todas as setas, embora o plugin continuasse ativando (`listener attached` no console, depois `keydown failed` a cada pressionamento):
  - `ISessions.open(id)` não existe mais — a troca agora passa por `uiWorkspace.openSession(target)`. O plugin já injetava `uiWorkspace` e declarava o peer `@deepseek-ai/dsh-client-ui-workspace`, então não foi preciso mudar o manifesto.
  - `SessionListState.current` foi eliminado — a sessão selecionada agora é derivada na cintura estreita (`deriveCurrent` em `src/client/navigate.ts`) a partir de `retainedBy.mainView > 0`, replicando o `mainSessionId` do host.
- Os serviços falsos de `tests/bundle.test.ts` foram remodelados para a forma real do instantâneo do host, para que o teste de fumaça do bundle detecte esta regressão.

### Nota

- A afirmação do 0.4.0 «Somente metadatos … apenas campos aditivos, nada removido» abaixo estava incorreta: `ISessions.open` e `SessionListState.current` haviam sim sido eliminados entre 0.1.5 e 0.1.7. Este release corrige isso.

## Sem publicar — `compat/0.2.0` (linha DSH 0.2.0)

### Mudado

- `peerDependencies` e `engines.dsh` reorientados para a linha DSH 0.2.0: `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). Somente metadados: cada superfície que este plugin lê (instantâneo de `sessions.list`, `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`) foi comparada entre as declarações 0.1.7-rc.2 e 0.2.0-rc.1 — apenas campos aditivos, nada removido.
- A documentação de instalação aponta para `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`; o pacote do registro é publicado como `0.4.0` sob o dist-tag `dsh-0.2.0`.

## Sem publicar — `compat/0.1.7` (linha DSH 0.1.7)

### Mudado

- `peerDependencies` e `engines.dsh` reorientados para a linha DSH 0.1.7: `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). Somente metadados: a suíte de detectores somente de leitura do 0.1.7 (D1–D11) não reporta nenhum caso, e este plugin não importa nenhum módulo `@deepseek-ai/*` em tempo de compilação nem de testes.
- A documentação de instalação aponta para `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`; o pacote do registro é publicado como `0.3.3` sob o dist-tag `dsh-0.1.7`.

### Acrescentado

- Configuração plana de ESLint (linha de base com checagem de tipos para src, linha de base recomendada para tests) e um script npm `lint`; `npm run lint` fica limpo.

## Sem publicar — `compat/0.1.5-rc` (linha DSH 0.1.5)

### Mudado

- `engines.dsh` estreitado para `>=0.1.5-alpha.1 <0.2.0-0` — o intervalo que este ramo de fato implementa. O `dsh.plugin.json` agora traz o mesmo intervalo em vez do `>=0.1.2-rc.1` obsoleto herdado do `master`.
- A documentação de instalação aponta para `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`; o pacote do registro (`dsh-arrowkey-nav@0.1.1`) continua sendo a linha ~0.1.2 do `master`, e as afirmações do README sobre o intervalo compatível foram alinhadas com o manifesto.

### Acrescentado

- Acessora de evidências de console somente de leitura `globalThis.__dshArrowkeyNav.snapshot()` (`diagnose-console.js`), que informa as formas dos instantâneos `sessions` / `workspaces` que a página realmente carregou, para que a adaptação ao 0.1.5 possa ser verificada num host vivo.

## 0.1.1

### Corrigido

- `types` e `exports["."].types` apontavam para `lib/types/index.d.ts`, que a compilação nunca emite — não estava no disco nem no tarball 0.1.0 publicado, de modo que os consumidores de TypeScript não recebiam declarações. Ambos apontam agora para `lib/index.d.ts`, que é emitido e incluído.
- `engines` estava ausente por completo, então nem a versão do Node nem a do DSH eram restritas. Agora ambas estão declaradas.
- `lib/` estava no gitignore e nenhum hook o compilava, de forma que publicar a partir de um clone limpo teria distribuído um tarball sem nenhuma saída compilada. Foi acrescentado o hook `prepublishOnly`.

### Acrescentado

- `dsh.plugin.json`, o manifesto de exibição `screenshots.json`, e `repository` / `homepage` / `keywords`.
- README e registros de mudanças em japonês e coreano, e o guia de instalação em inglês, chinês simplificado, japonês e coreano.

## 0.1.0

Primeira publicação: navegação com as teclas de seta para a GUI web do DSH.

### Acrescentado

- `↑` / `↓` trocam para a sessão anterior / seguinte dentro do espaço de trabalho atual, dando a volta nas extremidades e sem nunca cruzar para um espaço de trabalho vizinho.
- `←` / `→` trocam de espaço de trabalho entre todos.
- Depois de uma troca, a linha de destino é rolada até ficar visível, e o foco volta à caixa de redação se foi ali que o pressionamento começou, de modo que se pode continuar digitando de imediato.
- A identidade da sessão é lida dos dois controladores de cliente (`ctx.sessions`, `ctx.workspaces`), nunca do DOM: as linhas não trazem nem `data-*` nem `id`, então não é possível perguntar a uma linha que sessão ela é.
- «A próxima» segue a ordem que a barra lateral está desenhando, reconciliada com a pertença do controlador; recorre à ordem do controlador quando a barra lateral não está montada (barra recolhida), e uma seção ambígua ou que não bate recorre em vez de adivinhar.
- As setas são cedidas a quem já possui o evento: qualquer modificador, uma composição IME, um evento já tratado a montante, ou um foco dentro de um diálogo, menu ou outro campo editável.
- Uma caixa de redação vazia cede as suas setas; uma caixa de redação com rascunho as guarda para o cursor, então editar um prompt nunca é sequestrado.
- O listener é registrado na fase de captura, mas só chama `preventDefault()` quando de fato navega.
- A metade de navegador não tem componentes React, nem CSS, nem requisições de módulos de plataforma, e o pacote não tem dependências em tempo de execução.

### Limitações conhecidas

- Um grupo de espaços de trabalho recolhido não rola: as suas linhas não estão montadas e o dsh não expõe forma pública de desdobrar um grupo. A troca ocorre do mesmo jeito. O espaço de trabalho que contém a sessão atual é mantido desdobrado pelo próprio dsh, de modo que `↑`/`↓` não são afetados.
- Uma barra lateral recolhida não rola, pela mesma razão.
- O modo «numa lista só» não tem seções por espaço de trabalho, mas `←`/`→` continuam percorrendo a ordem de espaços do controlador, então a lista pode parecer saltar entre seções.
- A rolagem é de melhor esforço — qualquer falha de busca é engolida, porque a seleção já se moveu e uma linha ausente nunca deve virar uma errada.
- Fixado ao dsh 0.1.2-rc.1: os campos de instantâneo `sessions` e `workspaces` ainda não são estáveis. Se uma atualização do dsh os mudar, `src/client/navigate.ts` e `src/client/apply.ts` são os únicos arquivos a revisar; um serviço desaparecido deixa o plugin em espera em vez de fazer a página falhar.
