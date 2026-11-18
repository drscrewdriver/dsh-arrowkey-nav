# Guia de instalação (CLI oficial do DSH)

Este guia usa apenas o comando oficial `dsh plugin` do DSH. Esse comando instala a
dependência num perfil e sincroniza `dsh.profile.bundles`. Não o substitua
por um `npm install` simples, um `pnpm add` direto no perfil ou edições
manuais do manifesto do perfil.

- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Guide d'installation en français](./INSTALL.fr.md)
- [Installationsanleitung auf Deutsch](./INSTALL.de.md)
- [Guida all'installazione in italiano](./INSTALL.it.md)
- [Руководство по установке на русском](./INSTALL.ru.md)
- [Guía de instalación en español](./INSTALL.es.md)
- [Guia de instalação em português](./INSTALL.pt.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [README en français](./README.fr.md)
- [README auf Deutsch](./README.de.md)
- [README in italiano](./README.it.md)
- [README на русском](./README.ru.md)
- [README en español](./README.es.md)
- [README em português](./README.pt.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Changelog на русском](./CHANGELOG.ru.md)
- [Changelog en español](./CHANGELOG.es.md)
- [Changelog em português](./CHANGELOG.pt.md)

Os marcadores de posição deste guia são:

- `<profile>`: o perfil de DSH a modificar, normalmente `web`;
- `dsh-arrowkey-nav`: o pacote npm e o ID do plugin em tempo de execução.

> **Versões de DSH compatíveis: todos os rc das linhas 0.1.0–0.2.0.**
>
> Este guia documenta a versão `0.5.0` — a única versão para todas as linhas de host suportadas. Os campos de instantâneo `sessions` e `workspaces` que ele lê ainda não são estáveis; confira a versão em execução com `dsh --version` antes de instalar. Um host fora da lista branca é recusado por `engines.dsh`.

## 0. Pré-requisitos e descoberta do perfil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "```D`/profiles"
```

Use o perfil que o seu processo DSH em execução indicar. `web` é comum,
mas o argumento `--profile` realmente ativo é o que manda.

## 1. Instalação oficial

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav -w
```

(a bandeira `-w` é necessária quando o perfil é a raiz de um workspace de
pnpm, como `web` é.)

A versão `0.5.0` atende todas as linhas suportadas; o nome a seco instala o `latest` do registry, que é essa versão. Cada linha também tem um dist-tag para o mesmo build (`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`) se você preferir nomear a linha.

Instale explicitamente uma versão concreta do registro (a linha ~0.1.2 do
Para instalar uma linha de host concreta de forma explícita, use o seu dist-tag (todas as etiquetas apontam para o mesmo build):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.1.5 -w
```

A CLI oficial atualiza automaticamente a dependência do perfil, o lockfile
e o `dsh.profile.bundles`. Não acrescente uma linha YAML à mão.

### Período de carência da cadeia de suprimento

Somente instalações a partir do registro. O runtime do DSH usa pnpm 11, cuja
política `minimumReleaseAge` pode bloquear uma versão recém-publicada com
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Acrescente a versão a
`minimumReleaseAgeExclude` em `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.5.0
```

## 2. Reiniciar o perfil e recarregar a página

Este plugin inclui ambas as metades, e na metade de navegador mora o
listener de teclado. **Reinicie o perfil** — uma instância em execução não
carrega a quente uma nova camada de bundle — e depois **recarregue
`http://127.0.0.1:3080`**. Reiniciar sem recarregar deixa a página executando o
bundle de cliente anterior.

## 3. Atualizar

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Depois reinicie o perfil e recarregue a página.

## 4. Registro por caminho local (alternativa)

Para desenvolvimento ou instalações sem conexão, registre o plugin a partir de um
checkout local:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Um checkout de fontes precisa compilar antes de poder ser registrado:
`npm run build` regenera `lib/client.js` a partir de `src/client`. A compilação
precisa de `typescript`; se ele não estiver instalado naquele pacote, aponte
`DSH_TYPESCRIPT` para um diretório de módulo `typescript` existente. A
publicação compila automaticamente pelo hook `prepublishOnly`.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Verificar a instalação

```bash
grep -n "dsh-arrowkey-nav" \
  "```D`/profiles/<profile>/package.json"
node -p "require('```D`/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Confira a composição oficial:

```bash
dsh --profile <profile> --dump-default-config
```

Deve conter:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Verificar o plugin

Recarregue a página e confirme:

1. `↑` / `↓` passam para a sessão anterior / seguinte dentro do espaço de
   trabalho atual, dando a volta nas extremidades sem entrar num espaço de
   trabalho vizinho.
2. `←` / `→` passam entre espaços de trabalho.
3. A linha de destino é rolada até ficar visível depois de uma troca.
4. Pressionar uma seta com a caixa de redação vazia navega e deixa o foco na
   caixa de redação, de modo que se pode continuar digitando de imediato.
5. Quando a caixa de redação guarda um rascunho, as suas setas movem o
   cursor em vez de navegar.
6. As setas não fazem nada enquanto houver um diálogo ou menu aberto, durante uma
   composição IME ou com um modificador pressionado.

## 7. Solução de problemas

| Sintoma | Ação |
| --- | --- |
| `dsh` não encontrado | Instale ou habilite a CLI oficial do DSH. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Acrescente a versão a `minimumReleaseAgeExclude` no `pnpm-workspace.yaml` do perfil. |
| As setas não fazem nada | Confirme que a linha está composta e recarregue a página — o listener mora na metade de navegador. |
| As teclas se comportam como antes da instalação | O perfil não foi reiniciado ou a página não foi recarregada. |
| Nada rola depois de uma troca | É o esperado com um grupo de espaços de trabalho recolhido ou uma barra lateral reduzida; veja «Limitações conhecidas» no README. |
| As setas pararam de funcionar | Remova o plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); o listener pertence ao efeito Cordis do plugin e sai com ele. |

## 8. Remover

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Reinicie o perfil, e as teclas se comportam exatamente como antes da
instalação.

## Licença

MIT
