import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'
import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </ThemeProvider>
);
