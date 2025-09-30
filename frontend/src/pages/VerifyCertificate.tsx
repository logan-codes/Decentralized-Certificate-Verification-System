import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size > 0, {
    message: 'File must be selected',
  }),
})

interface CertificateData {
  isAuthentic: boolean,
  details: {
    fileHash: string,
    recipient: string,
    issued_by: string,
    issued_on: string,
    fileName: string,
  },
  checks: {
    blockchainVerification: boolean,
  }
}

interface ErrorResponse {
  error: string;
  verified: boolean;
  fileHash?: string;
  details?: string;
}

const VerifyCertificate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  
  const form = useForm({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fileH = params.get('fileH');
    if (fileH) {
      // If file hash is present in URL, initiate verification
      verifyByFileHash(fileH);
    }
  }, [location.search]);

  const verifyByFileHash = async (fileHash: string) => {
    setError(null);
    setCertificateData(null);
    setHasSearched(false);
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/verify-by-hash/${fileHash}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      const data = await response.json();
      setCertificateData(data);
      setLoading(false);
      setHasSearched(true);
    } catch (error) {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const parsedError: ErrorResponse = JSON.parse(errorMessage);
        setError(parsedError);
      } catch (parseError) {
        setError({ error: 'An unexpected error occurred', verified: false });
      }
      setLoading(false);
      setHasSearched(true);
    }
  }

  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    setError(null);
    setCertificateData(null);
    setHasSearched(false);
    setLoading(true);
    const formData = new FormData();
    formData.append('file', values.file);
    
    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      const data = await response.json();
      setCertificateData(data);
      setLoading(false);
      setHasSearched(true);
    } catch (error) {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const parsedError: ErrorResponse = JSON.parse(errorMessage);
        setError(parsedError);
      } catch (parseError) {
        setError({ error: 'An unexpected error occurred', verified: false });
      }
      setLoading(false);
      setHasSearched(true);
    }
    form.reset();
  }

  const resetForm = () => {
    setError(null);
    setCertificateData(null);
    setHasSearched(false);
    form.reset();
    navigate('/verify');
  }

  return (
    <>
      <Navbar />
      <div className='flex flex-col items-center justify-center min-h-screen mx-5 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Verify Certificate</h1>
        
        {loading && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-md text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-blue-700 font-medium'>Verifying certificate...</p>
          </div>
        )}

        {error && hasSearched && !certificateData?.isAuthentic && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md'>
            <div className='flex items-center mb-2'>
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className='text-lg font-semibold text-red-800'>Verification Failed</h3>
            </div>
            <p className='text-red-700 mb-2'>{error.error}</p>
            {error.fileHash && (
              <p className='text-sm text-red-600 mb-2'>File Hash: {error.fileHash}</p>
            )}
            {error.details && (
              <p className='text-sm text-red-500'>{error.details}</p>
            )}
          </div>
        )}

        {certificateData &&
          (certificateData.isAuthentic ? (
          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-md'>
            <div className='flex items-center mb-4'>
            
              <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className='text-xl font-semibold text-green-800'>{certificateData.isAuthentic ? 'Certificate Verified' : 'Invalid Certificate'}</h2>
            </div>
            <div className='space-y-3'>
              <div>
                <span className='font-medium text-green-700'>File Hash:</span>
                <p className='text-green-600 break-all'>{certificateData.details.fileHash}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Recipient:</span>
                <p className='text-green-600'>{certificateData.details.recipient}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Issuer:</span>
                <p className='text-green-600'>{certificateData.details.issued_by}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Issued On:</span>
                <p className='text-green-600 break-all text-sm'>{certificateData.details.issued_on}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                  certificateData.isAuthentic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {certificateData.isAuthentic ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md'>
            <div className='flex items-center mb-2'>
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className='text-lg font-semibold text-red-800'>Invalid Certificate</h3>
            </div>
            <p className='text-red-700 mb-2'>The certificate could not be verified as authentic.</p>
            <div className='space-y-3'>
              <div>
                <span className='font-medium text-red-700'>File Hash:</span>
                <p className='text-red-600 break-all'>{certificateData.details.fileHash}</p>
              </div>
              <div>
                <span className='font-medium text-red-700'>Recipient:</span>
                <p className='text-red-600'>{certificateData.details.recipient}</p>
              </div>
              <div>
                <span className='font-medium text-red-700'>Issuer:</span>
                <p className='text-red-600'>{certificateData.details.issued_by}</p>
              </div>
              <div>
                <span className='font-medium text-red-700'>Issued On:</span>
                <p className='text-red-600 break-all text-sm'>{certificateData.details.issued_on}</p>
              </div>
              <div>
                <span className='font-medium text-red-700'>Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                  certificateData.isAuthentic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {certificateData.isAuthentic ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {!certificateData && (
          <div className='w-full max-w-md'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormDescription className='text-center text-gray-600 mb-4'>
                  Upload the file to verify the certificate authenticity on the blockchain.
                </FormDescription>
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormControl>
                      <Input type='file'  onChange={e => field.onChange(e.target.files?.[0])}/>
                    </FormControl>
                  )}
                />
                <Button 
                  type="submit" 
                  className='w-full' 
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Certificate'}
                </Button>
              </form>
            </Form>
          </div>
        )}

        {(certificateData || (error && hasSearched)) && (
          <Button 
            onClick={resetForm} 
            variant="outline" 
            className='mt-4'
          >
            Verify Another Certificate
          </Button>
        )}
      </div>
    </>
  )
}

export default VerifyCertificate
