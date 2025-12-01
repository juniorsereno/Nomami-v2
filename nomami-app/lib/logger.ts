import pino from 'pino';

<<<<<<< HEAD
// const isDevelopment = process.env.NODE_ENV === 'development';
=======
const isDevelopment = process.env.NODE_ENV === 'development';
>>>>>>> fe187ae2b4cbdb6ccf5d7d3f77cf948e85752b9a

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
<<<<<<< HEAD
export function logWebhookPayload(source: string, payload: unknown) {
=======
export function logWebhookPayload(source: string, payload: any) {
>>>>>>> fe187ae2b4cbdb6ccf5d7d3f77cf948e85752b9a
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
<<<<<<< HEAD
export function logError(error: unknown, message: string, context?: Record<string, unknown>) {
=======
export function logError(error: unknown, message: string, context?: Record<string, any>) {
>>>>>>> fe187ae2b4cbdb6ccf5d7d3f77cf948e85752b9a
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