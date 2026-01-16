# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de verificação de assinantes do clube de benefícios NoMami. O sistema permite que parceiros verifiquem o status de assinatura de clientes através de três funcionalidades principais: exibição do número da carteirinha no cartão digital, página de consulta pública por número da carteirinha, e QR code no cartão digital que direciona para verificação automática.

## Glossary

- **Sistema**: O sistema de verificação de assinantes NoMami
- **Cartão_Digital**: Componente visual que exibe as informações da carteirinha do assinante
- **Card_ID**: Identificador único alfanumérico da carteirinha (ex: "ABC123")
- **Assinante**: Usuário do clube de benefícios NoMami (individual ou corporativo)
- **Parceiro**: Estabelecimento comercial que aceita o cartão NoMami
- **Status_Ativo**: Assinante com status='ativo' E next_due_date >= data atual E (se corporativo) removed_at=null
- **Status_Vencido**: Assinante que não atende aos critérios de Status_Ativo
- **Página_Consulta**: Interface pública em /consulta para verificação manual
- **Página_Verificação**: Interface pública em /verificar/[card_id] para verificação via QR code
- **QR_Code**: Código QR que codifica a URL de verificação do assinante

## Requirements

### Requirement 1: Exibição do Número da Carteirinha no Cartão Digital

**User Story:** Como assinante, eu quero ver o número da minha carteirinha no cartão digital, para que eu possa informá-lo aos parceiros quando solicitado.

#### Acceptance Criteria

1. THE Cartão_Digital SHALL exibir o Card_ID de forma visível e legível
2. WHEN o Cartão_Digital é renderizado, THE Sistema SHALL posicionar o Card_ID abaixo do nome do titular e acima da data de validade
3. THE Sistema SHALL formatar o Card_ID com o prefixo "Cartão Nº: " seguido do identificador
4. THE Sistema SHALL exibir o Card_ID com tamanho de fonte entre text-xs e text-sm (Tailwind CSS)
5. THE Sistema SHALL exibir o Card_ID tanto em cartões individuais quanto corporativos
6. WHEN o assinante possui subscriber_type='corporate' E removed_at IS NOT NULL, THE Sistema SHALL exibir o Card_ID no cartão inativo

### Requirement 2: Página de Consulta Pública por Número da Carteirinha

**User Story:** Como parceiro, eu quero consultar o status de um assinante pelo número da carteirinha, para que eu possa verificar se ele está ativo antes de conceder o benefício.

#### Acceptance Criteria

1. THE Sistema SHALL disponibilizar uma página pública acessível em /consulta
2. THE Página_Consulta SHALL exibir um campo de input com label "Digite o número da carteirinha"
3. THE Página_Consulta SHALL exibir um placeholder "Ex: ABC123" no campo de input
4. WHEN o usuário digita no campo de input, THE Sistema SHALL converter automaticamente para maiúsculas
5. THE Página_Consulta SHALL exibir um botão "Consultar"
6. WHEN o usuário clica em "Consultar", THE Sistema SHALL buscar o assinante pelo Card_ID informado
7. WHEN o assinante é encontrado E possui Status_Ativo, THE Sistema SHALL exibir "✅ ASSINATURA ATIVA" em verde e tamanho grande
8. WHEN o assinante é encontrado E NÃO possui Status_Ativo, THE Sistema SHALL exibir "❌ ASSINATURA VENCIDA" em vermelho e tamanho grande
9. WHEN o assinante é encontrado, THE Sistema SHALL exibir o nome completo do assinante
10. WHEN o assinante é encontrado, THE Sistema SHALL exibir o número da carteirinha
11. WHEN o assinante é encontrado, THE Sistema SHALL exibir a data de validade (next_due_date) formatada em pt-BR
12. WHEN o assinante é encontrado, THE Sistema SHALL exibir o tipo "Individual" ou "Corporativo"
13. WHEN o assinante é encontrado E subscriber_type='corporate', THE Sistema SHALL exibir o nome da empresa
14. WHEN o Card_ID não é encontrado no banco de dados, THE Sistema SHALL exibir "Carteirinha não encontrada"
15. THE Página_Consulta SHALL ser responsiva e otimizada para dispositivos móveis

### Requirement 3: Lógica de Validação de Status do Assinante

**User Story:** Como sistema, eu preciso determinar corretamente o status de um assinante, para que parceiros recebam informações precisas sobre a validade da assinatura.

#### Acceptance Criteria

1. WHEN um assinante possui status='ativo' E next_due_date >= data atual, THE Sistema SHALL considerar o assinante como Status_Ativo
2. WHEN um assinante individual possui status='inativo' OU next_due_date < data atual, THE Sistema SHALL considerar o assinante como Status_Vencido
3. WHEN um assinante corporativo possui removed_at IS NOT NULL, THE Sistema SHALL considerar o assinante como Status_Vencido
4. WHEN um assinante corporativo possui status='inativo', THE Sistema SHALL considerar o assinante como Status_Vencido
5. WHEN um assinante corporativo possui status='ativo' E next_due_date >= data atual E removed_at IS NULL, THE Sistema SHALL considerar o assinante como Status_Ativo

### Requirement 4: API de Consulta de Assinante

**User Story:** Como desenvolvedor, eu preciso de uma API para consultar assinantes por Card_ID, para que as páginas públicas possam obter os dados necessários.

#### Acceptance Criteria

1. THE Sistema SHALL disponibilizar um endpoint GET em /api/consulta
2. WHEN uma requisição é feita para /api/consulta?card_id=ABC123, THE Sistema SHALL buscar o assinante usando a query getSubscriberByCardId
3. WHEN o assinante é encontrado, THE Sistema SHALL retornar um JSON contendo: name, card_id, status, next_due_date, subscriber_type, company_name
4. WHEN o assinante é encontrado, THE Sistema SHALL retornar HTTP status 200
5. WHEN o Card_ID não é encontrado, THE Sistema SHALL retornar HTTP status 404
6. WHEN ocorre um erro no banco de dados, THE Sistema SHALL retornar HTTP status 500

### Requirement 5: QR Code no Cartão Digital

**User Story:** Como parceiro, eu quero escanear um QR code no cartão digital do assinante, para que eu possa verificar rapidamente o status da assinatura sem digitar manualmente.

#### Acceptance Criteria

1. THE Cartão_Digital SHALL exibir um QR_Code
2. THE Sistema SHALL posicionar o QR_Code no canto inferior esquerdo do Cartão_Digital
3. THE Sistema SHALL renderizar o QR_Code com dimensões de 40x40 pixels
4. THE Sistema SHALL aplicar um fundo branco ou semi-transparente ao QR_Code
5. THE QR_Code SHALL codificar a URL https://[dominio]/verificar/[card_id]
6. THE Sistema SHALL utilizar a biblioteca qrcode.react para gerar o QR_Code
7. THE QR_Code SHALL ser exibido tanto em cartões individuais quanto corporativos
8. WHEN o assinante possui subscriber_type='corporate' E removed_at IS NOT NULL, THE Sistema SHALL exibir o QR_Code no cartão inativo

### Requirement 6: Página de Verificação via QR Code

**User Story:** Como parceiro, eu quero acessar diretamente a página de verificação ao escanear o QR code, para que eu possa ver imediatamente o status da assinatura.

#### Acceptance Criteria

1. THE Sistema SHALL disponibilizar uma página pública acessível em /verificar/[card_id]
2. WHEN a página é acessada com um Card_ID válido E o assinante possui Status_Ativo, THE Sistema SHALL exibir "✅ ASSINATURA ATIVA" em verde e tamanho grande
3. WHEN a página é acessada com um Card_ID válido E o assinante NÃO possui Status_Ativo, THE Sistema SHALL exibir "❌ ASSINATURA VENCIDA" em vermelho e tamanho grande
4. WHEN a página é acessada com um Card_ID válido, THE Sistema SHALL exibir o nome completo do assinante
5. WHEN a página é acessada com um Card_ID válido, THE Sistema SHALL exibir o número da carteirinha
6. WHEN a página é acessada com um Card_ID válido, THE Sistema SHALL exibir a data de validade formatada em pt-BR
7. WHEN a página é acessada com um Card_ID válido, THE Sistema SHALL exibir o tipo "Individual" ou "Corporativo"
8. WHEN a página é acessada com um Card_ID válido E subscriber_type='corporate', THE Sistema SHALL exibir o nome da empresa
9. WHEN a página é acessada com um Card_ID inválido, THE Sistema SHALL exibir uma mensagem de erro
10. THE Página_Verificação SHALL ser responsiva e otimizada para dispositivos móveis
11. THE Página_Verificação SHALL utilizar a mesma lógica de validação definida no Requirement 3

### Requirement 7: Instalação de Dependências

**User Story:** Como desenvolvedor, eu preciso instalar as bibliotecas necessárias, para que o sistema possa gerar QR codes.

#### Acceptance Criteria

1. THE Sistema SHALL incluir a biblioteca qrcode.react como dependência do projeto
2. WHEN o comando npm install é executado, THE Sistema SHALL instalar qrcode.react e suas dependências
