import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import NoteProvider from "@/providers/NoteProvider";
import Script from 'next/script'


export const metadata: Metadata = {
  title: "NoteJewel",
};

function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 py-4 flex flex-col items-center justify-center mt-auto">
      {/* Google AdSense Responsive Ad Unit */}
      <div className="w-full flex justify-center">
        <ins className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: 90 }}
          data-ad-client="ca-pub-4143521375584293"
          data-ad-slot="YOUR_SLOT_ID"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
      <Script id="adsbygoogle-footer" strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4143521375584293"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >

          <NoteProvider>
            <div className="flex min-h-screen w-full flex-col">
              <Header/>
              <main className="flex flex-1 flex-col px-3 sm:px-4 pt-4 sm:pt-6 xl:px-8">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster/>
          </NoteProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
