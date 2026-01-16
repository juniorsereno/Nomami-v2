# Implementation Plan: Sistema de Verificação de Assinantes

## Overview

Este plano implementa o sistema de verificação de assinantes em três fases principais: (1) lógica de validação e utilitários, (2) componentes e modificações no cartão digital, e (3) páginas públicas e API. Cada tarefa é incremental e testável.

## Tasks

- [x] 1. Instalar dependências e configurar utilitários base
  - Executar `npm install qrcode.react` para adicionar biblioteca de QR code
  - Criar arquivo `lib/subscriber-validation.ts` com função de validação de status
  - Implementar lógica que verifica: status ativo, data de vencimento, removed_at para corporativos
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2_

- [x] 1.1 Escrever property tests para validação de status
  - **Property 4: Active Status Validation**
  - **Property 5: Inactive Status Validation**
  - **Property 6: Corporate Removed Status Validation**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 1.2 Escrever unit tests para edge cases de validação
  - Testar assinante com data de vencimento exatamente hoje
  - Testar assinante corporativo com removed_at null vs preenchido
  - Testar combinações de status inativo com datas futuras
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Criar componente SubscriberStatusDisplay
  - Criar arquivo `components/subscriber-status-display.tsx`
  - Implementar interface SubscriberStatusDisplayProps
  - Renderizar status visual (✅ ATIVA ou ❌ VENCIDA) com cores apropriadas
  - Exibir nome, card_id, validade formatada em pt-BR, tipo (Individual/Corporativo)
  - Exibir nome da empresa para assinantes corporativos
  - Aplicar estilos Tailwind CSS responsivos
  - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 2.1 Escrever property tests para SubscriberStatusDisplay
  - **Property 11: Status Display for Active Subscribers**
  - **Property 12: Status Display for Inactive Subscribers**
  - **Property 13: Corporate Company Name Display**
  - **Property 14: Date Formatting Consistency**
  - **Validates: Requirements 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 2.2 Escrever unit tests para SubscriberStatusDisplay
  - Testar renderização com assinante ativo
  - Testar renderização com assinante vencido
  - Testar exibição de empresa apenas para corporativos
  - Testar formatação de data em pt-BR
  - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

- [x] 3. Modificar componente DigitalCard para exibir card_id
  - Abrir arquivo `components/digital-card.tsx`
  - Adicionar exibição do card_id com formato "Cartão Nº: [card_id]"
  - Posicionar abaixo do nome do titular e acima da data de validade
  - Aplicar tamanho de fonte text-xs ou text-sm
  - Garantir exibição em cartões individuais, corporativos e inativos
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3.1 Escrever property tests para exibição de card_id
  - **Property 1: Card ID Formatting**
  - **Property 2: Card ID Display Across Subscriber Types**
  - **Validates: Requirements 1.3, 1.5**

- [x] 3.2 Escrever unit tests para card_id no DigitalCard
  - Testar presença do texto "Cartão Nº:"
  - Testar posicionamento relativo (após nome, antes de validade)
  - Testar classes CSS aplicadas (text-xs ou text-sm)
  - Testar exibição em cartão inativo corporativo
  - _Requirements: 1.2, 1.4, 1.6_

- [x] 4. Adicionar QR code ao componente DigitalCard
  - Importar QRCodeSVG de 'qrcode.react'
  - Adicionar QR code no canto inferior esquerdo do cartão
  - Configurar props: size=40, bgColor="#FFFFFF", fgColor="#000000", level="M", marginSize=1
  - URL do QR code: `https://[dominio]/verificar/${subscriber.card_id}`
  - Aplicar fundo branco/semi-transparente ao QR code
  - Garantir exibição em cartões individuais, corporativos e inativos
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 4.1 Escrever property tests para QR code
  - **Property 9: QR Code URL Pattern**
  - **Property 10: QR Code Display Across Subscriber Types**
  - **Validates: Requirements 5.5, 5.7**

- [x] 4.2 Escrever unit tests para QR code no DigitalCard
  - Testar presença do componente QRCodeSVG
  - Testar props do QR code (size, colors, level)
  - Testar posicionamento (canto inferior esquerdo)
  - Testar exibição em cartão inativo corporativo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.8_

- [x] 5. Checkpoint - Verificar componentes base
  - Executar todos os testes: `npm test`
  - Verificar visualmente o DigitalCard com card_id e QR code
  - Confirmar que não há erros de TypeScript: `npm run type-check`
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 6. Criar API route para consulta de assinantes
  - Criar arquivo `app/api/consulta/route.ts`
  - Implementar handler GET que recebe query param card_id
  - Usar getSubscriberByCardId para buscar assinante
  - Usar validateSubscriberStatus para determinar isActive
  - Retornar JSON com: name, card_id, status, next_due_date, subscriber_type, company_name, isActive
  - Retornar status 200 para sucesso, 404 para não encontrado, 400 para card_id inválido, 500 para erro de banco
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6.1 Escrever property tests para API route
  - **Property 7: API Response Completeness**
  - **Property 8: API Success Status Code**
  - **Validates: Requirements 4.3, 4.4**

- [x] 6.2 Escrever unit tests para API route
  - Testar resposta 404 para card_id inexistente
  - Testar resposta 400 para card_id vazio ou inválido
  - Testar resposta 500 para erro de banco de dados (mockar erro)
  - Testar estrutura do JSON de resposta
  - _Requirements: 4.5, 4.6_

- [x] 7. Criar página de consulta manual (/consulta)
  - Criar arquivo `app/consulta/page.tsx`
  - Implementar página pública (sem autenticação)
  - Adicionar campo de input com label "Digite o número da carteirinha"
  - Adicionar placeholder "Ex: ABC123"
  - Implementar conversão automática para maiúsculas no input (onChange)
  - Adicionar botão "Consultar"
  - Implementar chamada para API /api/consulta ao clicar no botão
  - Exibir loading state durante busca
  - Usar componente SubscriberStatusDisplay para exibir resultado
  - Exibir mensagem "Carteirinha não encontrada" para 404
  - Exibir mensagem de erro genérica para outros erros
  - Aplicar estilos Tailwind CSS responsivos
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.14, 2.15_

- [x] 7.1 Escrever property test para conversão de maiúsculas
  - **Property 3: Input Uppercase Conversion**
  - **Validates: Requirements 2.4**

- [x] 7.2 Escrever unit tests para página de consulta
  - Testar renderização inicial (input, botão, labels)
  - Testar comportamento do botão de consulta
  - Testar exibição de loading state
  - Testar exibição de mensagem "Carteirinha não encontrada"
  - Testar exibição de erro de rede
  - Testar integração com SubscriberStatusDisplay
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.14_

- [x] 8. Criar página de verificação via QR code (/verificar/[card_id])
  - Criar diretório `app/verificar/[card_id]/`
  - Criar arquivo `app/verificar/[card_id]/page.tsx`
  - Implementar página pública (sem autenticação)
  - Extrair card_id dos params da URL
  - Implementar busca automática ao carregar (useEffect)
  - Chamar API /api/consulta com card_id da URL
  - Exibir loading state durante busca
  - Usar componente SubscriberStatusDisplay para exibir resultado
  - Exibir mensagem "Carteirinha inválida" para card_id malformado
  - Exibir mensagem "Carteirinha não encontrada" para 404
  - Exibir mensagem de erro genérica para outros erros
  - Aplicar estilos Tailwind CSS responsivos
  - _Requirements: 6.1, 6.9, 6.10, 6.11_

- [x] 8.1 Escrever unit tests para página de verificação
  - Testar renderização com card_id válido
  - Testar renderização com card_id inválido na URL
  - Testar loading state automático
  - Testar exibição de mensagem "Carteirinha não encontrada"
  - Testar exibição de erro de rede
  - Testar integração com SubscriberStatusDisplay
  - _Requirements: 6.1, 6.9_

- [x] 9. Checkpoint final - Testes de integração
  - Executar todos os testes: `npm test`
  - Testar fluxo completo de consulta manual:
    - Acessar /consulta
    - Digitar card_id válido
    - Verificar resultado correto
  - Testar fluxo completo de QR code:
    - Visualizar cartão digital
    - Verificar presença de QR code
    - Escanear QR code (ou acessar URL manualmente)
    - Verificar resultado correto em /verificar/[card_id]
  - Testar casos de erro:
    - Card_id inexistente
    - Card_id inválido
    - Assinante vencido
  - Verificar responsividade em dispositivos móveis
  - Confirmar que não há erros de TypeScript: `npm run type-check`
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 10. Documentação e ajustes finais
  - Adicionar comentários JSDoc nas funções principais
  - Verificar acessibilidade (labels, alt texts, ARIA)
  - Revisar mensagens de erro para clareza
  - Confirmar que todas as propriedades de correção foram testadas
  - Atualizar README se necessário

## Notes

- Todas as tarefas de teste são obrigatórias para garantir qualidade e correção
- Cada task referencia os requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de correção
- Unit tests validam exemplos específicos e edge cases
- Ambos os tipos de teste são complementares e importantes para qualidade
