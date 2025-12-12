# Guia de Otimização de Performance

## ✅ Implementado

### 1. Cache de Sessão NextAuth
- **Arquivo**: `components/auth/session-provider.tsx`
- **Mudança**: Aumentado `refetchInterval` de 5min para 30min
- **Impacto**: Reduz requisições de validação de sessão em 83%
- **Desabilitado**: `refetchOnWindowFocus` para evitar revalidações desnecessárias

### 2. Prefetch Automático de Rotas
- **Arquivo**: `components/smooth-link.tsx`
- **Funcionalidade**: 
  - Prefetch ao montar o componente
  - Prefetch adicional ao hover do mouse
  - Rotas já carregadas quando usuário clica
- **Impacto**: Navegação instantânea entre páginas

### 3. Sistema de Cache Local
- **Arquivo**: `hooks/use-cached-data.ts`
- **Funcionalidade**:
  - Cache no localStorage com TTL configurável
  - Invalidação manual quando necessário
  - Fallback automático para dados em cache
- **Uso**:
```typescript
const { data, loading, refetch, invalidate } = useCachedData(
  async () => fetch('/api/partners').then(r => r.json()),
  { key: 'partners-list', ttl: CACHE_TIMES.PARTNERS }
)
```

### 4. Configurações de Cache Centralizadas
- **Arquivo**: `lib/cache-config.ts`
- **Tempos definidos**:
  - Parceiros: 30 minutos
  - Assinantes: 15 minutos
  - Dashboard: 5 minutos
  - Logs: 2 minutos

### 5. Componente de Imagem Otimizado
- **Arquivo**: `components/optimized-image.tsx`
- **Funcionalidades**:
  - Lazy loading automático
  - Loading state com skeleton
  - Fallback para imagens quebradas
  - Transições suaves

## 📋 Recomendações Adicionais

### 6. Otimizar Rotas de API
Adicione cache headers nas rotas de API:

```typescript
// app/api/partners/route.ts
import { getCacheHeaders } from '@/lib/cache-config'

export async function GET() {
  const data = await fetchPartners()
  
  return Response.json(data, {
    headers: getCacheHeaders(CACHE_TIMES.PARTNERS)
  })
}
```

### 7. Marcar Páginas como Estáticas
Para páginas que não mudam frequentemente:

```typescript
// app/partners/page.tsx
export const revalidate = REVALIDATE_TIMES.STATIC_PAGES // 1 hora

export default async function PartnersPage() {
  // ...
}
```

### 8. Implementar React Query (Opcional)
Para gerenciamento de estado mais robusto:

```bash
npm install @tanstack/react-query
```

### 9. Otimizar Imagens
Substituir tags `<img>` por `<OptimizedImage>`:

```typescript
import { OptimizedImage } from '@/components/optimized-image'

<OptimizedImage
  src="/logo.png"
  alt="Logo"
  width={150}
  height={40}
  priority // Para imagens above-the-fold
/>
```

### 10. Lazy Loading de Componentes
Para componentes pesados:

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <div>Carregando...</div>,
  ssr: false // Se não precisar de SSR
})
```

## 🎯 Próximos Passos

1. **Aplicar cache nas páginas principais**:
   - Dashboard
   - Lista de parceiros
   - Lista de assinantes

2. **Adicionar cache headers nas APIs**:
   - `/api/partners`
   - `/api/subscribers`
   - `/api/dashboard/stats`

3. **Otimizar imagens**:
   - Converter para WebP
   - Usar `OptimizedImage` component
   - Adicionar `priority` para imagens importantes

4. **Monitorar performance**:
   - Usar Chrome DevTools
   - Verificar Network tab
   - Medir Core Web Vitals

## 📊 Métricas Esperadas

- **Tempo de navegação**: Redução de ~70% (de ~500ms para ~150ms)
- **Requisições de API**: Redução de ~60% com cache
- **Tempo de carregamento inicial**: Redução de ~30% com prefetch
- **Uso de banda**: Redução de ~40% com cache de imagens

## 🔧 Configurações Recomendadas

### next.config.ts
```typescript
const nextConfig = {
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
  },
}
```

## 🚀 Uso dos Novos Recursos

### Cache de Dados
```typescript
import { useCachedData } from '@/hooks/use-cached-data'
import { CACHE_TIMES } from '@/lib/cache-config'

function PartnersPage() {
  const { data: partners, loading, invalidate } = useCachedData(
    async () => {
      const res = await fetch('/api/partners')
      return res.json()
    },
    { 
      key: 'partners-list', 
      ttl: CACHE_TIMES.PARTNERS 
    }
  )

  // Invalidar cache quando adicionar novo parceiro
  const handleAddPartner = async () => {
    await addPartner(...)
    invalidate() // Força refresh dos dados
  }
}
```

### Links com Prefetch
```typescript
import { SmoothLink } from '@/components/smooth-link'

// Prefetch habilitado por padrão
<SmoothLink href="/dashboard">Dashboard</SmoothLink>

// Desabilitar prefetch se necessário
<SmoothLink href="/heavy-page" prefetch={false}>
  Página Pesada
</SmoothLink>
```
