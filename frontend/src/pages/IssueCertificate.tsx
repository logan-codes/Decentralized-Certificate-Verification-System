import Navbar from '@/components/Navbar'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const formSchema = z.object({
  recipient: z.string().min(2).max(50),
  issuer: z.string().min(2).max(50),
  file: z.instanceof(File).refine((file) => file.size > 0, {
    message: 'File must be selected',
  }),
})

interface ErrorResponse {
  error: string;
  verified: boolean;
  certID?: string;
  details?: string;
}

const IssueCertificate = () => {
  const [qrCode, setQrCode] = useState(null);
  const [CertID, setCertID] = useState(null);
  const [Link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: '',
      issuer: '',
    },
  })

  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('recipient', values.recipient);
    formData.append('issuer', values.issuer);
    formData.append('file', values.file);
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
      fetch('http://localhost:3001/api/issue',{
        method: 'POST',
        body: formData,
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(JSON.stringify(errorData));
            });
          }
          return response.json();
        })
        .then(data => {
          if ( data.certID && data.qr) {
            setQrCode(data.qr); 
            setCertID(data.certID);
            setLink(data.link);
            setError(null);
          } else {
            setError({
              error: data.error || 'Certificate issuing failed',
              verified: false,
              certID: data.certID,
              details: data.details
            });
            setQrCode(null); 
            setCertID(null);
            setLink(null);
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
          setQrCode(null); 
          setCertID(null);
          setLink(null);
        })
        .finally(() => {
          setLoading(false);
        });
  }

  const handleDownload = () => {
    if (!qrCode) return
    const link = document.createElement('a')
    link.href = qrCode
    link.download = 'certificate-qr.png'
    link.click()
  }

  const handleCopy = async () => {
    if (!Link) return
    try {
      await navigator.clipboard.writeText(Link)
      toast('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }


  return (
    <>
      <Navbar/>
        <div className='flex flex-col items-center justify-center min-h-screen mx-5 py-8'>
          <h1 className='text-3xl font-bold mb-8'>Issue Certificate Page</h1>
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
          {!qrCode ? (
          <div className='w-full max-w-md'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormDescription className='text-center text-gray-600 mb-4'>
                  Fill in the details to issue a new certificate.
                </FormDescription>
                <FormField
                  control={form.control}
                  name='recipient'
                  render={({ field }) => (
                    <FormControl>
                      <Input placeholder='Recipient' {...field} />
                    </FormControl>
                )}/>
                <FormField
                  control={form.control}
                  name='issuer'
                  render={({ field }) => (
                    <FormControl>
                      <Input placeholder='Issuer' {...field} />
                    </FormControl>
                )}/>
                <FormField
                  control={form.control}
                  name='file'
                  render={({ field }) => (
                    <FormControl>
                      <Input type='file'  onChange={e => field.onChange(e.target.files?.[0])}/>
                    </FormControl>
                )}/>
                <Button className='mt-4 flex justify-center w-full ' type='submit'>Issue Certificate</Button>
              </form>
            </Form>
          </div>
          ):
          (<div className='mt-25 mx-5 flex flex-col items-center justify-center'>
          <Card className="--color-background">
            <CardHeader>
              <CardTitle className='text-xl font-bold text-center'>Certificate Issued</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col items-center'>
              <p className='mb-4'>Certificate ID: <span className='font-mono font-bold'>{CertID}</span></p> 
              
              <img  src={qrCode} alt="QR Code" className='w-200-px h-200-px border-4 rounded-2xl' />
              <div>
                <Button className='mt-4 mx-3' onClick={()=>{setQrCode(null)}}>Back</Button>
                <Button className='mt-4 mx-3' onClick={handleDownload}>Download QR Code</Button>
                <Button className='mt-4 mx-3' onClick={handleCopy}>Copy Link</Button>
              </div>
            </CardContent>
          </Card>
        </div>)
      }
      </div>
    </>
  )
}

export default IssueCertificate
