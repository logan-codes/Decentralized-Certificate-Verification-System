import Navbar from '@/components/ui/Navbar'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  recipient: z.string().min(2).max(50),
  issuer: z.string().min(2).max(50),
  file: z.instanceof(File).refine((file) => file.size > 0, {
    message: 'File must be selected',
  }),
})


const IssueCertificate = () => {
  const [qrCode, setQrCode] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: '',
      issuer: '',
      file: undefined,
    },
  })

  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('file', values.file);

    try {
      const uploadRes = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.filename) throw new Error('Upload failed');

      const qrRes = await fetch('http://localhost:3001/api/issue', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          recipient: values.recipient,
          issuer: values.issuer,
          file: uploadResult.filename,
        }),
      });

      const qrResult = await qrRes.json();
      setQrCode(qrResult.qr); // ✅ Store the QR Data URL 
    } catch (err) {
      console.error('Error:', err);
    }
  }

  const handleDownload = () => {
    if (!qrCode) return
    const link = document.createElement('a')
    link.href = qrCode
    link.download = 'certificate-qr.png'
    link.click()
  }

  const handleCopy = async () => {
    if (!qrCode) return
    try {
      await navigator.clipboard.writeText(qrCode)
      alert('QR data copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }


  return (
    <>
      <Navbar/>
      {!qrCode ? (
        <div className='flex flex-col items-center justify-center mt-25 mx-5'>
          <h1>Issue Certificate Page</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormDescription className='mb-4'>
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
        </div>):
        (<div className='mt-25 mx-5 flex flex-col items-center justify-center'>
          <Card className="--color-background">
            <CardHeader>
              <CardTitle className='text-xl font-bold text-center'>Certificate QR Code</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col items-center'>
              <img  src={qrCode} alt="QR Code" className='w-200-px h-200-px border-4 rounded-2xl' />
              <div>
                <Button className='mt-4 mx-3' onClick={()=>{setQrCode(null)}}>Back</Button>
                <Button className='mt-4 mx-3' onClick={handleDownload}>Download QR Code</Button>
                <Button className='mt-4 mx-3' onClick={handleCopy}>Copy QR Code</Button>
              </div>
            </CardContent>
          </Card>
        </div>)
      }
    </>
  )
}

export default IssueCertificate
