# Implementation Plan: WhatsApp Message Cadence

## Overview

Este plano implementa a funcionalidade de Cadência de Mensagens WhatsApp, permitindo que administradores configurem sequências automatizadas de mensagens para novos assinantes. A implementação segue uma abordagem incremental, começando pela estrutura de dados, seguida pelos serviços de backend, e finalizando com a interface de usuário.

## Tasks

- [x] 1. Configurar estrutura de banco de dados
  - [x] 1.1 Criar migration para tabela cadence_messages
    - Criar arquivo SQL em `nomami-app/migrations/`
    - Incluir campos: id, type, content, order_number, is_active, created_at, updated_at
    - Criar índice único para order_number em mensagens ativas
    - _Requirements: 1.5, 1.6_

  - [x] 1.2 Criar migration para tabela whatsapp_config
    - Criar arquivo SQL para configurações key-value
    - Incluir campos: id, key, value, updated_at
    - _Requirements: 5.1, 6.2_

  - [x] 1.3 Criar migration para tabela whatsapp_message_logs
    - Criar arquivo SQL para logs de envio
    - Incluir campos: id, subscriber_id, subscriber_name, subscriber_phone, message_id, message_type, message_content, status, error_message, api_response, created_at
    - Criar índices para created_at e status
    - _Requirements: 4.1, 4.2_

- [x] 2. Implementar tipos e validações
  - [x] 2.1 Criar tipos TypeScript para o módulo
    - Criar arquivo `nomami-app/lib/whatsapp/types.ts`
    - Definir interfaces: CadenceMessage, MessageLog, WhatsAppConfig, ValidationResult
    - _Requirements: 1.5, 4.1_

  - [x] 2.2 Implementar funções de validação
    - Criar arquivo `nomami-app/lib/whatsapp/validation.ts`
    - Implementar validateTextMessage (rejeitar strings vazias/whitespace)
    - Implementar validateMediaUrl (validar URLs HTTP/HTTPS)
    - Implementar validatePhoneNumber (validar formato brasileiro)
    - _Requirements: 2.1, 2.2, 2.3, 6.3_

  - [x] 2.3 Escrever property tests para validações
    - **Property 5: Empty Text Validation Rejection**
    - **Property 6: Invalid URL Validation Rejection**
    - **Property 10: Phone Number Formatting**
    - **Validates: Requirements 2.1, 2.2, 2.3, 6.4**

- [x] 3. Implementar serviço WhatsApp API
  - [x] 3.1 Criar serviço de envio de mensagens
    - Criar arquivo `nomami-app/lib/whatsapp/api-service.ts`
    - Implementar sendText com payload correto
    - Implementar sendImage com mediatype "image"
    - Implementar sendVideo com mediatype "video"
    - Implementar sendAdminNotification
    - _Requirements: 3.2, 3.3, 3.4, 5.2_

  - [x] 3.2 Escrever property tests para payloads da API
    - **Property 7: API Payload Format Correctness**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. Implementar API de mensagens de cadência
  - [x] 4.1 Criar rota GET /api/whatsapp/cadence
    - Criar arquivo `nomami-app/app/api/whatsapp/cadence/route.ts`
    - Retornar mensagens ativas ordenadas por order_number
    - _Requirements: 1.6, 3.1_

  - [x] 4.2 Criar rota POST /api/whatsapp/cadence
    - Validar tipo, conteúdo e ordem
    - Persistir mensagem no banco
    - Retornar mensagem criada
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [x] 4.3 Criar rota PUT /api/whatsapp/cadence/[id]
    - Criar arquivo `nomami-app/app/api/whatsapp/cadence/[id]/route.ts`
    - Validar campos atualizados
    - Atualizar mensagem no banco
    - _Requirements: 1.7_

  - [x] 4.4 Criar rota DELETE /api/whatsapp/cadence/[id]
    - Remover mensagem (soft delete ou hard delete)
    - Reordenar mensagens restantes automaticamente
    - _Requirements: 1.8_

  - [x] 4.5 Criar rota PUT /api/whatsapp/cadence/reorder
    - Criar arquivo `nomami-app/app/api/whatsapp/cadence/reorder/route.ts`
    - Receber array de IDs na nova ordem
    - Atualizar order_number de todas as mensagens afetadas
    - _Requirements: 7.2_

  - [x] 4.6 Escrever property tests para persistência de mensagens
    - **Property 1: Message Persistence Round-Trip**
    - **Property 2: Message Update Persistence**
    - **Property 3: Message Deletion with Reordering**
    - **Property 4: Message Ordering Invariant**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8**

- [x] 5. Checkpoint - Verificar APIs de mensagens
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar API de configuração
  - [x] 6.1 Criar rota GET /api/whatsapp/config
    - Criar arquivo `nomami-app/app/api/whatsapp/config/route.ts`
    - Retornar adminPhone
    - _Requirements: 6.1_

  - [x] 6.2 Criar rota PUT /api/whatsapp/config
    - Validar formato do telefone
    - Formatar para padrão WhatsApp (número@s.whatsapp.net)
    - Persistir configuração
    - _Requirements: 5.1, 6.2, 6.4_

- [x] 7. Implementar API de logs
  - [x] 7.1 Criar rota GET /api/whatsapp/logs
    - Criar arquivo `nomami-app/app/api/whatsapp/logs/route.ts`
    - Implementar paginação (page, limit)
    - Implementar filtros (status, startDate, endDate)
    - Retornar logs em ordem decrescente por data
    - _Requirements: 4.3_

  - [x] 7.2 Escrever property tests para ordenação de logs
    - **Property 9: Log Ordering**
    - **Validates: Requirements 4.3**

- [x] 8. Implementar serviço de envio de cadência
  - [x] 8.1 Criar serviço de execução de cadência
    - Criar arquivo `nomami-app/lib/whatsapp/cadence-service.ts`
    - Implementar função executeCadence(subscriber)
    - Buscar mensagens ativas ordenadas
    - Enviar cada mensagem com delay configurável
    - Criar log para cada envio (sucesso ou falha)
    - _Requirements: 3.1, 3.5, 4.1, 4.2_

  - [x] 8.2 Implementar notificação de falha ao admin
    - Verificar se adminPhone está configurado
    - Enviar mensagem com detalhes do erro e assinante
    - Logar falha secundária se notificação falhar
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 8.3 Escrever property tests para logs de envio
    - **Property 8: Log Creation with Correct Fields**
    - **Property 11: Admin Notification on Failure**
    - **Validates: Requirements 4.1, 4.2, 5.2**

- [x] 9. Integrar com webhooks de pagamento
  - [x] 9.1 Modificar handler do webhook Asaas
    - Editar `nomami-app/lib/asaas/webhook-handler.ts`
    - Identificar eventos de novo pagamento confirmado
    - Chamar executeCadence para novos assinantes
    - _Requirements: 3.1_

  - [x] 9.2 Modificar handler do webhook Stripe
    - Editar `nomami-app/lib/stripe/webhook-handler.ts`
    - Identificar eventos de novo pagamento confirmado (invoice.payment_succeeded)
    - Chamar executeCadence para novos assinantes
    - _Requirements: 3.1_

- [x] 10. Checkpoint - Verificar backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implementar componentes de UI
  - [x] 11.1 Criar componente MessageForm
    - Criar arquivo `nomami-app/components/whatsapp/message-form.tsx`
    - Implementar seleção de tipo (text/image/video)
    - Renderizar campos apropriados para cada tipo
    - Implementar seleção de ordem
    - Validar antes de submeter
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 11.2 Criar componente MessageList
    - Criar arquivo `nomami-app/components/whatsapp/message-list.tsx`
    - Exibir mensagens com ícone de tipo, preview e ordem
    - Implementar truncamento de texto (100 chars + ...)
    - Implementar drag-and-drop para reordenação
    - Botões de editar e excluir
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.3 Escrever property tests para truncamento de texto
    - **Property 12: Text Preview Truncation**
    - **Property 13: Drag Reorder Consistency**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 11.4 Criar componente AdminPhoneConfig
    - Criar arquivo `nomami-app/components/whatsapp/admin-phone-config.tsx`
    - Input para telefone do admin
    - Validação de formato
    - Feedback de sucesso/erro
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.5 Criar componente LogsTable
    - Criar arquivo `nomami-app/components/whatsapp/logs-table.tsx`
    - Tabela com colunas: data, assinante, tipo, status, erro
    - Filtros por status e data
    - Paginação
    - _Requirements: 4.3_

- [x] 12. Atualizar página WhatsApp
  - [x] 12.1 Integrar componentes na página
    - Editar `nomami-app/app/whatsapp/page.tsx`
    - Adicionar seção de configuração de cadência
    - Adicionar seção de configuração do admin
    - Adicionar seção de logs
    - Organizar em tabs ou seções colapsáveis
    - _Requirements: 1.1, 6.1, 4.3_

  - [x] 12.2 Implementar estado e handlers
    - Gerenciar estado de mensagens, config e logs
    - Implementar handlers para CRUD de mensagens
    - Implementar handler para salvar config
    - Implementar refresh de logs
    - _Requirements: 1.5, 1.7, 1.8, 6.2_

- [x] 13. Checkpoint final - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- A implementação usa TypeScript com Next.js App Router
- O banco de dados é PostgreSQL via Neon
- A biblioteca fast-check será usada para property-based testing
