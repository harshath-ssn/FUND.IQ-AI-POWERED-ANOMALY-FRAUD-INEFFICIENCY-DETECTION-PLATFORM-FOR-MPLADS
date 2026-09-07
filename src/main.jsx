import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n'
import { WorkflowProvider } from './store/workflowStore'
import { NavigationProvider } from './store/navigationStore'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <WorkflowProvider>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </WorkflowProvider>
    </LanguageProvider>
  </StrictMode>,
)
