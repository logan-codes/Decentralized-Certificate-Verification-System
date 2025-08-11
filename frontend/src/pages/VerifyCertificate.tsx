import Navbar from '@/components/ui/Navbar'
import { useEffect } from 'react'
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


const VerifyCertificate = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      const res = fetch(`http://localhost:3001/api/verify?certID=${id}`);
    }
  }, [id]);


  const onSubmit = async(values: z.infer<typeof formSchema>) => {
    navigate('/verify?certID=' + encodeURIComponent(values.certID));
  }

  return (
    <>
      <Navbar />
      {!id ? (
        <div className='flex flex-col items-center justify-center mt-25 mx-5'>
          <h1 className='text-2xl font-bold'>Verify Certificate</h1>
          <Form {...form}>
            <form className='w-1/2' onSubmit={form.handleSubmit(onSubmit)}>
              <FormDescription className='mb-4'>
                Enter the Certificate ID to verify the certificate.
              </FormDescription>
              <FormField
                control={form.control}
                name="certID"
                render={({ field }) => (
                  <FormControl>
                    <Input placeholder="Enter Certificate ID" {...field} />
                  </FormControl>
                )}
              />
              <Button type="submit" className='mt-4'>Verify Certificate</Button>
            </form>
          </Form>
        </div>
        ):(
          <div className='flex flex-col items-center justify-center mt-25 mx-5'>
            <h1 className='text-2xl font-bold'>Certificate Verified</h1>
            <p className='text-xl'>Your certificate has been verified successfully.</p>
            <Button onClick={() => {navigate('/verify');}} className='mt-4'>Verify Another Certificate</Button>
          </div>
        )
      }
    </>
  )
}

export default VerifyCertificate
