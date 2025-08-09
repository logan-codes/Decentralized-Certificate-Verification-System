import '../index.css'
import { useState } from 'react';
import IssueCertificate from './pages/IssueCertificate';
import VerifyCertificate from './pages/VerifyCertificate';

function App() {
  const [page, setPage] = useState<'issue' | 'verify'>('issue');

  return (
    <>
      <div style={{ padding: 20 }}>
      <h1>Verichain</h1>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setPage('issue')}>Issue Certificate</button>
        <button onClick={() => setPage('verify')} style={{ marginLeft: 10 }}>Verify Certificate</button>
      </div>
      {page === 'issue' && <IssueCertificate />}
      {page === 'verify' && <VerifyCertificate />}
    </div>
    </>
  )
}

export default App
