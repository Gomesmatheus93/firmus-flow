import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html')
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster theme="dark" position="top-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
