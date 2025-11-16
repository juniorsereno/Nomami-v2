# Contexto Técnico: Script de Automação Playwright

Este documento serve como um guia de referência técnica para o script de automação desenvolvido na feature `005-playwright-login-automation`. Ele resume as decisões de implementação, os desafios encontrados e as soluções aplicadas.

## Arquitetura

O script opera como um serviço Node.js independente, localizado na pasta `playwright-automation`. Ele utiliza o Express para expor uma API RESTful e o Playwright para realizar a automação do navegador.

-   **API**: Um único endpoint `POST /login` recebe as credenciais (`usuario`, `senha`) e orquestra a automação.
-   **Automação**: A lógica principal reside em `src/automation.js`, que encapsula todo o fluxo de interação com o sistema externo.

## Fluxo de Automação

O script executa a seguinte sequência de ações:

1.  **Inicia o Navegador**: Lança uma instância do Chromium em modo `headless: false` (visível) para facilitar a depuração.
2.  **Define o Viewport**: A janela é configurada para `1920x1080` para garantir que todos os elementos da interface do sistema alvo estejam visíveis e não sejam ocultados por layouts responsivos.
3.  **Aplica Zoom**: O zoom da página é ajustado para `80%` para garantir a visibilidade de todos os elementos, uma vez que a página não se adapta bem a diferentes resoluções.
4.  **Navega para Login**: Acessa a URL `https://sistemabh.com.br/rssaude/app_Login`.
5.  **Preenche Credenciais**: Utiliza seletores de ID (`#id_sc_field_login`, `#id_sc_field_pswd`) para preencher os campos de usuário e senha. Um pequeno `delay` de 100ms é adicionado para simular digitação humana.
6.  **Clica em Login**: Clica no botão de login usando seu ID (`#sub_form_b`).
7.  **Aguarda Redirecionamento**: Confirma o sucesso do login esperando a URL da página mudar e não conter mais `app_Login`.
8.  **Navega no Menu**:
    -   Passa o mouse (`hover`) sobre o menu "Movimentação" (`#item_60`) para abrir o submenu.
    -   Clica no item "Arquivo" (`#item_61`) usando `{ force: true }` para contornar elementos que possam estar sobrepondo o link.
9.  **Interage com o Iframe**:
    -   O conteúdo da seção "Arquivo" é carregado dentro de um `iframe` com o nome `app_menu_item_61_iframe`.
    -   O script localiza este `iframe` especificamente.
    -   Aguarda o botão "Novo" (`#sc_b_new_top`) se tornar visível dentro deste `iframe`. Esta foi a solução chave, pois a página não dispara um evento de navegação padrão.
10. **Clica em "Novo"**:
    -   Utiliza `dispatchEvent('click')` para clicar no botão "Novo". Esta abordagem de baixo nível foi necessária para contornar sobreposições de elementos que impediam um clique padrão, mesmo com a opção `force`.

## Desafios e Soluções

-   **Seletores Instáveis**:
    -   **Problema**: Seletores baseados em classes, `name` ou `labels` se mostraram ineficazes.
    -   **Solução**: Utilizar os IDs únicos dos elementos (`#id_sc_field_login`, `#sub_form_b`, etc.), que são mais estáveis.

-   **Elementos Ocultos (Layout/Zoom)**:
    -   **Problema**: O botão "Novo" não era encontrado porque a janela do navegador era muito pequena ou o zoom da página fazia com que ele ficasse fora da área visível.
    -   **Solução**: Definir um viewport grande (`1920x1080`) e aplicar um zoom de `80%` na página.

-   **Interação com Menus e Submenus**:
    -   **Problema**: Clicar diretamente no menu principal não abria o submenu de forma confiável.
    -   **Solução**: Usar a ação `.hover()` para simular o comportamento do usuário de passar o mouse sobre o menu.

-   **Elementos Sobrepostos (Pointer Events)**:
    -   **Problema**: Outros elementos na página interceptavam o clique no submenu "Arquivo", mesmo quando ele estava visível.
    -   **Solução**: Usar a opção `{ force: true }` no método `.click()`.

-   **Estrutura de Iframes Aninhados**:
    -   **Problema**: O maior desafio foi descobrir que o conteúdo da seção "Arquivo" era carregado em um *segundo iframe* (`app_menu_item_61_iframe`), e não no iframe principal da aplicação.
    -   **Solução**: Adicionar um passo de depuração para listar todos os `iframes` na página, o que revelou a estrutura correta. O script foi então ajustado para mirar no `iframe` correto antes de procurar o botão "Novo".

-   **Carregamento Dinâmico (AJAX)**:
    -   **Problema**: O conteúdo do iframe era carregado dinamicamente sem uma navegação de página completa, fazendo com que `waitForURL` ou `waitForNavigation` falhassem.
    -   **Solução**: Em vez de esperar por uma navegação, o script agora espera diretamente pela visibilidade do elemento alvo (`#sc_b_new_top`) dentro do `iframe` correto.

-   **Clique Interceptado no Botão Final**:
    -   **Problema**: Mesmo visível, o clique no botão "Novo" falhava devido a elementos sobrepostos.
    -   **Solução**: Usar `dispatchEvent('click')` como uma alternativa de baixo nível ao `.click()`, que efetivamente contornou as verificações de interceptação de eventos do Playwright.