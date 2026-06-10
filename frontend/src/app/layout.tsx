import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RAG Chat",
  description: "Retrieval Augmented Generation with Groq, LlamaIndex & Qdrant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full flex overflow-hidden bg-gray-950 text-gray-100 antialiased">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </body>
    </html>
  );
}
