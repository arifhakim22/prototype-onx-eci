import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Oltest2EnglishFe from './Oltest2EnglishFe.tsx'
import OmnixEci from './OmnixEci.tsx'

const pathname = window.location.pathname;
const isEnglish = pathname === '/oltest2_english_fe' || pathname === '/oltest2_english_fe/';
const isOmnix = pathname === '/omnix_eci' || pathname === '/omnix_eci/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isOmnix ? <OmnixEci /> : isEnglish ? <Oltest2EnglishFe /> : <App />}
  </StrictMode>,
)
