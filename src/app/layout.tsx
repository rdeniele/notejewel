import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import NoteProvider from "@/providers/NoteProvider";
import ConditionalFooter from "@/components/ConditionalFooter";


export const metadata: Metadata = {
  title: "NoteJewel",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

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
              <ConditionalFooter />
            </div>
            <Toaster/>
          </NoteProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
