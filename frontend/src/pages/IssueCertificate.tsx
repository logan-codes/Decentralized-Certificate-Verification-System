import Navbar from '@/components/ui/Navbar'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
      const uploadRes = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.filename) throw new Error('Upload failed');

      const qrRes = await fetch('http://localhost:3001/issue', {
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

  return (
    <>
      <Navbar/>
      <div className='mt-25 mx-5'>
        <p>Issue Certificate Page</p>
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
            <Button className='mt-4' type='submit'>Issue Certificate</Button>
          </form>
        </Form>
        {qrCode && (
        <div>
          <h3>Generated QR Code:</h3>
          <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
        </div>
      )}
      </div>
    </>
  )
}

export default IssueCertificate
