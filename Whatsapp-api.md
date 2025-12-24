Olá, aqui está os endpoint para enviar mensagem no whatsapp, enviar imagem, enviar PDF, enviar Video.

Para enviar mensagem:

```http
POST https://criativa-evolution-api.cyzbs5.easypanel.host/message/sendText/nomami
HEADER apikey 3646379846E0-400B-806F-2E52A157F4BE
BODY {
  "number": "phonenumber@s.whatsapp.net",
  "text": "texto a ser enviado (substitua \n por \\n)",
  "delay": 1000,
  "linkPreview": false
}
```

Para enviar video:

```http
POST https://criativa-evolution-api.cyzbs5.easypanel.host/message/sendMedia/nomami
HEADER apikey 3646379846E0-400B-806F-2E52A157F4BE
BODY {
  "number": "phonenumber@s.whatsapp.net",
  "mediatype": "video",
  "mimetype": "video/mp4",
  "media": "mediaUrl",
  "fileName": "video.mp4"
}

```

Para enviar imagem:

```http
POST https://criativa-evolution-api.cyzbs5.easypanel.host/message/sendMedia/nomami
HEADER apikey 3646379846E0-400B-806F-2E52A157F4BE
BODY {
  "number": "phonenumber@s.whatsapp.net",
  "mediatype": "image",
  "mimetype": "image/jpeg",
  "media": "mediaUrl",
  "fileName": "image.jpg"
}
```

Para enviar mensagem pro adm quando falhar use:

```http
POST https://criativa-evolution-api.cyzbs5.easypanel.host/message/sendText/nomami
HEADER apikey 3646379846E0-400B-806F-2E52A157F4BE
BODY {
  "number": "556198069801@s.whatsapp.net",
  "text": "ATENÇÃO!\n\nTivemos uma nova assinatura mas não foi possível enviar a mensagem de boas-vindas.\n\nCliente: {{ cliente.name }}\nTelefone: {{ cliente.telefone }}\nData Assinatura: {{ cliente.assinatura }}",
  "delay": 1000,
  "linkPreview": false
}