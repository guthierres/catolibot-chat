import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import CustomFooter from "@/components/custom-footer" // Importe o CustomFooter

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WhatsApp Chatbot System",
  description: "Gerencie seu chatbot WhatsApp Business com integração Meta API",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <CustomFooter /> {/* Adicione o CustomFooter aqui */}
        </ThemeProvider>
      </body>
    </html>
  )
}
