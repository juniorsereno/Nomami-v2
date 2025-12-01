import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // transport: isDevelopment
  //   ? {
  //       target: 'pino-pretty',
  //       options: {
  //         colorize: true,
  //         ignore: 'pid,hostname',
  //         translateTime: 'SYS:standard',
  //       },
  //     }
  //   : undefined,
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'creditCard',
      'cvv',
      'apiKey',
      '*.password',
      '*.token',
      '*.authorization',
      '*.creditCard',
      '*.cvv',
      '*.apiKey',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Helper para logar payloads de webhook com segurança.
 * Garante que o payload seja tratado como um objeto para redação correta.
 */
export function logWebhookPayload(source: string, payload: unknown) {
  logger.info(
    {
      webhookSource: source,
      payload,
    },
    `Webhook received from ${source}`
  );
}

/**
 * Helper para logar erros com contexto.
 */
export function logError(error: unknown, message: string, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    logger.error(
      {
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...context,
      },
      message
    );
  } else {
    logger.error(
      {
        err: error,
        ...context,
      },
      message
    );
  }
}