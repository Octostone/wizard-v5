import './globals.css'
import type { Metadata } from 'next'
import { FormProvider } from '../context/FormContext'

export const metadata: Metadata = {
  title: 'Flourish Wizard',
  description: 'Multi-page guided web form for Google Sheets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <FormProvider>
          {children}
        </FormProvider>
      </body>
    </html>
  )
}
