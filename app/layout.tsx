import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthButton from "./components/AuthButton";
import { createClient } from "@/lib/supabase/server";
import SupabaseListener from "./components/SupabaseListener";
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "One-Pager",
  description: "Create beautiful one-pagers with ease.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <SupabaseListener serverAccessToken={session?.access_token} />
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h1 className="text-xl font-semibold text-gray-800">One-Pager</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Templates</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Examples</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Help</a>
            </nav>
            <div className="flex items-center space-x-4">
               <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                 <span>New One-Pager</span>
               </button>
              <AuthButton session={session} />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
