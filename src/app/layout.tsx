import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silvernoise Admin',
  description: 'Internal admin panel — restricted access',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-sn-black text-sn-white antialiased">
        {children}
      </body>
    </html>
  )
}
