import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App.tsx'
import './index.css'
import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </I18nextProvider>
  </ThemeProvider>
);
