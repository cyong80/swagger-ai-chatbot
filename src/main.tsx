import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="swagger-ai-theme">
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}
