import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || 'dummy-project-id-for-build',
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || 'dummy-server-key-for-build',
});
