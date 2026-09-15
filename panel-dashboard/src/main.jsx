import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomThemeProvider } from './theme/ThemeContext'
import { ToastProvider } from './components/Toast/ToastContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

/**
 * Estado de servidor de los módulos Pëtru (los que hablan con Laravel).
 * Los módulos del ERP siguen con sus `api/` en memoria y no pasan por acá.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CustomThemeProvider>
      <CssBaseline />
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </ToastProvider>
    </CustomThemeProvider>
  </StrictMode>,
)
