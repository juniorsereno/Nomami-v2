import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Usado para monitoramento e verificação de disponibilidade
 */
export async function GET() {
  const memUsage = process.memoryUsage();
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    },
    nodeVersion: process.version,
  });
}
