import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import IssueCertificate from './pages/IssueCertificate.tsx'
import VerifyCertificate from './pages/VerifyCertificate.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App/>} />
      <Route path='/issue' element={<IssueCertificate/>} />
      <Route path='/verify' element={<VerifyCertificate/>} />
    </Routes>
  </BrowserRouter>
)
