# Data Model: Melhoria de Logs do Backend

## Entities

### Log Entry

Representa a estrutura de um registro de log gerado pelo sistema. Baseado no formato padrão do Pino (JSON).

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `level` | `number` | Nível de severidade (10=TRACE, 20=DEBUG, 30=INFO, 40=WARN, 50=ERROR, 60=FATAL). | `30` |
| `time` | `number` | Timestamp em milissegundos (Epoch). | `1638360000000` |
| `pid` | `number` | Process ID. | `1234` |
| `hostname` | `string` | Nome do host onde o serviço está rodando. | `api-server-1` |
| `msg` | `string` | Mensagem descritiva do evento. | `Request received` |
| `req` | `object` | (Opcional) Detalhes da requisição HTTP. | `{ method: 'GET', url: '/api/users' }` |
| `res` | `object` | (Opcional) Detalhes da resposta HTTP. | `{ statusCode: 200 }` |
| `err` | `object` | (Opcional) Detalhes do erro (stack trace, message). | `{ message: 'Database timeout', stack: '...' }` |
| `context` | `object` | (Opcional) Metadados adicionais de negócio. | `{ userId: '123', action: 'search_partner' }` |

### Redaction Rules

Campos que devem ser ofuscados automaticamente nos logs para proteção de dados.

- `password`
- `token`
- `authorization`
- `creditCard`
- `cvv`
- `apiKey`