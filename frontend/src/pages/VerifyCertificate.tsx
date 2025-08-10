import Navbar from '@/components/ui/Navbar'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  qr_url: z.string().min(1, { message: 'This field is required' }),
})


const VerifyCertificate = () => {
  const [verify, setVerify] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qr_url: '',
    },
  })

  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch('http://localhost:3001/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ qr_url: values.qr_url }),
      });

      if (!res.ok) throw new Error('Verification failed');

      setVerify(true);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  return (
    <>
      <Navbar />
      {!verify ? (
        <div className='flex flex-col items-center justify-center mt-25 mx-5'>
          <h1 className='text-2xl font-bold'>Verify Certificate</h1>
          <Form {...form}>
            <form className='w-1/2' onSubmit={form.handleSubmit(onSubmit)}>
              <FormDescription className='mb-4'>
                Enter the QR Code URL to verify the certificate.
              </FormDescription>
              <FormField
                control={form.control}
                name="qr_url"
                render={({ field }) => (
                  <FormControl>
                    <Input placeholder="Enter QR Code URL" {...field} />
                  </FormControl>
                )}
              />
              <Button type="submit" className='mt-4'>Verify Certificate</Button>
            </form>
          </Form>
        </div>
        ):(
          <div className='flex flex-col items-center justify-center mt-10'>
            <h1 className='text-2xl font-bold'>Certificate Verified</h1>
            <p className='text-xl'>Your certificate has been verified successfully.</p>
            <Button onClick={() => setVerify(false)} className='mt-4'>Verify Another Certificate</Button>
          </div>
        )
      }
    </>
  )
}

export default VerifyCertificate
