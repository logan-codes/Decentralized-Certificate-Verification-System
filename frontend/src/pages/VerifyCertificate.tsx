import Navbar from '@/components/ui/Navbar'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  certID: z.string().min(1, { message: 'This field is required' }),
})

interface CertificateData {
  verified: boolean;
  data: {
    recipient: string;
    issuer: string;
    file: string;
    valid: boolean;
  };
  certID?: string;
}

interface ErrorResponse {
  error: string;
  verified: boolean;
  certID?: string;
  details?: string;
}

const VerifyCertificate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('certID');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      certID: '',
    },
  })

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      fetch(`http://localhost:3001/api/verify?certID=${encodeURIComponent(id)}`)
        .then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(JSON.stringify(errorData));
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.verified && data.data) {
            setCertificateData(data);
            setError(null);
          } else {
            setError({
              error: data.error || 'Certificate verification failed',
              verified: false,
              certID: data.certID,
              details: data.details
            });
            setCertificateData(null);
          }
        })
        .catch(err => {
          try {
            const errorData = JSON.parse(err.message);
            setError(errorData);
          } catch {
            setError({
              error: 'Failed to verify certificate',
              verified: false,
              details: err.message
            });
          }
          setCertificateData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    setError(null);
    setCertificateData(null);
    setHasSearched(false);
    navigate('/verify?certID=' + encodeURIComponent(values.certID.trim()));
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

        {error && hasSearched && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md'>
            <div className='flex items-center mb-2'>
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className='text-lg font-semibold text-red-800'>Verification Failed</h3>
            </div>
            <p className='text-red-700 mb-2'>{error.error}</p>
            {error.certID && (
              <p className='text-sm text-red-600 mb-2'>Certificate ID: {error.certID}</p>
            )}
            {error.details && (
              <p className='text-sm text-red-500'>{error.details}</p>
            )}
          </div>
        )}

        {certificateData && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-md'>
            <div className='flex items-center mb-4'>
              <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className='text-xl font-semibold text-green-800'>Certificate Verified</h2>
            </div>
            <div className='space-y-3'>
              <div>
                <span className='font-medium text-green-700'>Certificate ID:</span>
                <p className='text-green-600 break-all'>{certificateData.certID}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Recipient:</span>
                <p className='text-green-600'>{certificateData.data.recipient}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Issuer:</span>
                <p className='text-green-600'>{certificateData.data.issuer}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>File Hash:</span>
                <p className='text-green-600 break-all text-sm'>{certificateData.data.file}</p>
              </div>
              <div>
                <span className='font-medium text-green-700'>Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                  certificateData.data.valid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {certificateData.data.valid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>
        )}

        {!certificateData && (
          <div className='w-full max-w-md'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormDescription className='text-center text-gray-600 mb-4'>
                  Enter the Certificate ID to verify the certificate authenticity on the blockchain.
                </FormDescription>
                <FormField
                  control={form.control}
                  name="certID"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        placeholder="Enter Certificate ID" 
                        {...field} 
                        disabled={loading}
                        className='text-center'
                      />
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
