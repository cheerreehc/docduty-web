import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from 'sonner'
import { UserProvider } from "@/contexts/UserContext";


export default function App({ Component, pageProps }: AppProps) {
  return (
    
    <UserProvider>
      <Component {...pageProps} />
      <Toaster richColors position="top-center" theme="light" />
    </UserProvider>
    
  )
}
