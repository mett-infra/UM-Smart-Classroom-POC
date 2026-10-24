import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DemoProvider } from './store/DemoStore'
import '@fontsource-variable/plus-jakarta-sans'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* basename lets the app run from a sub-folder such as /UM-Smart-Classroom-POC/ on GitHub Pages */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <DemoProvider>
        <App />
      </DemoProvider>
    </BrowserRouter>
  </StrictMode>,
)
