# Requirements Document

## Introduction

Este documento especifica os requisitos para a funcionalidade de Cadência de Mensagens WhatsApp no sistema Nomami. A funcionalidade permite que administradores configurem uma sequência automatizada de mensagens (texto, imagem, vídeo) que serão enviadas para novos assinantes após a confirmação de pagamento. O sistema também inclui logging de falhas e notificação ao administrador quando ocorrerem erros no envio.

## Glossary

- **Message_Cadence_System**: Sistema responsável por gerenciar e executar a cadência de mensagens para novos assinantes
- **Cadence_Message**: Uma mensagem individual dentro da sequência de cadência (pode ser texto, imagem ou vídeo)
- **Admin_User**: Usuário administrador que configura as mensagens de cadência
- **New_Subscriber**: Cliente que acabou de efetuar um pagamento e se tornou assinante
- **WhatsApp_API**: API externa da Evolution para envio de mensagens WhatsApp
- **Message_Log**: Registro de tentativas de envio de mensagens com status de sucesso ou falha
- **Admin_Phone**: Número de telefone do administrador que receberá notificações de falha

## Requirements

### Requirement 1: Gerenciamento de Mensagens de Cadência

**User Story:** As an Admin_User, I want to create and manage cadence messages, so that I can define the automated message sequence for new subscribers.

#### Acceptance Criteria

1. WHEN an Admin_User clicks the "Add Message" button, THE Message_Cadence_System SHALL display a modal with options to select message type (text, image, or video)
2. WHEN an Admin_User selects "text" as message type, THE Message_Cadence_System SHALL display a text input field and an order selector
3. WHEN an Admin_User selects "image" as message type, THE Message_Cadence_System SHALL display a URL input field for the image link and an order selector
4. WHEN an Admin_User selects "video" as message type, THE Message_Cadence_System SHALL display a URL input field for the video link and an order selector
5. WHEN an Admin_User submits a valid Cadence_Message, THE Message_Cadence_System SHALL persist the message to the database with its type, content, and order
6. WHEN an Admin_User views the cadence configuration page, THE Message_Cadence_System SHALL display all configured messages ordered by their sequence number
7. WHEN an Admin_User edits an existing Cadence_Message, THE Message_Cadence_System SHALL update the message content and order in the database
8. WHEN an Admin_User deletes a Cadence_Message, THE Message_Cadence_System SHALL remove the message and reorder remaining messages automatically

### Requirement 2: Validação de Mensagens

**User Story:** As an Admin_User, I want the system to validate my message inputs, so that I can ensure messages are correctly configured before saving.

#### Acceptance Criteria

1. WHEN an Admin_User attempts to save a text message with empty content, THE Message_Cadence_System SHALL display an error message and prevent saving
2. WHEN an Admin_User attempts to save an image message with an invalid URL, THE Message_Cadence_System SHALL display an error message and prevent saving
3. WHEN an Admin_User attempts to save a video message with an invalid URL, THE Message_Cadence_System SHALL display an error message and prevent saving
4. WHEN an Admin_User attempts to save a message with a duplicate order number, THE Message_Cadence_System SHALL display a warning and offer to reorder existing messages

### Requirement 3: Envio Automático de Mensagens

**User Story:** As a system operator, I want the system to automatically send cadence messages to new subscribers, so that they receive a welcome sequence after payment.

#### Acceptance Criteria

1. WHEN a New_Subscriber completes a payment, THE Message_Cadence_System SHALL retrieve all active Cadence_Messages ordered by sequence
2. WHEN sending a text message, THE Message_Cadence_System SHALL call the WhatsApp_API sendText endpoint with the subscriber's phone number and message content
3. WHEN sending an image message, THE Message_Cadence_System SHALL call the WhatsApp_API sendMedia endpoint with mediatype "image" and the configured URL
4. WHEN sending a video message, THE Message_Cadence_System SHALL call the WhatsApp_API sendMedia endpoint with mediatype "video" and the configured URL
5. WHEN multiple messages exist in the cadence, THE Message_Cadence_System SHALL send them in order with a configurable delay between each message

### Requirement 4: Logging de Envios

**User Story:** As an Admin_User, I want to view logs of message sending attempts, so that I can monitor the system and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a message is sent successfully, THE Message_Cadence_System SHALL create a Message_Log entry with status "success", timestamp, subscriber info, and message details
2. WHEN a message fails to send, THE Message_Cadence_System SHALL create a Message_Log entry with status "failed", timestamp, subscriber info, message details, and error description
3. WHEN an Admin_User views the logs section, THE Message_Cadence_System SHALL display logs in reverse chronological order with filtering options
4. THE Message_Cadence_System SHALL retain Message_Log entries for at least 30 days

### Requirement 5: Notificação de Falhas ao Administrador

**User Story:** As an Admin_User, I want to be notified via WhatsApp when message sending fails, so that I can take immediate action.

#### Acceptance Criteria

1. WHEN an Admin_User configures the Admin_Phone, THE Message_Cadence_System SHALL persist the phone number in the database
2. WHEN a message fails to send to a New_Subscriber, THE Message_Cadence_System SHALL send a notification to the Admin_Phone with subscriber details and error information
3. IF the Admin_Phone is not configured, THEN THE Message_Cadence_System SHALL log the failure without attempting admin notification
4. WHEN the admin notification itself fails, THE Message_Cadence_System SHALL log this secondary failure without retrying

### Requirement 6: Interface de Configuração do Telefone Admin

**User Story:** As an Admin_User, I want to configure my notification phone number, so that I can receive failure alerts.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the WhatsApp configuration page, THE Message_Cadence_System SHALL display a field to input the Admin_Phone
2. WHEN an Admin_User saves a valid phone number, THE Message_Cadence_System SHALL persist it and display a success confirmation
3. WHEN an Admin_User enters an invalid phone format, THE Message_Cadence_System SHALL display a validation error
4. THE Message_Cadence_System SHALL format the phone number to the WhatsApp format (e.g., 5561999999999@s.whatsapp.net) before storing

### Requirement 7: Visualização e Ordenação de Mensagens

**User Story:** As an Admin_User, I want to view and reorder my cadence messages visually, so that I can easily manage the message sequence.

#### Acceptance Criteria

1. WHEN viewing the message list, THE Message_Cadence_System SHALL display each message with its type icon, preview content, and order number
2. WHEN an Admin_User drags a message to a new position, THE Message_Cadence_System SHALL update the order of all affected messages
3. WHEN displaying a text message preview, THE Message_Cadence_System SHALL show the first 100 characters with ellipsis if truncated
4. WHEN displaying an image or video message, THE Message_Cadence_System SHALL show a thumbnail or placeholder icon with the URL
