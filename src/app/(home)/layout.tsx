import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { Navbar } from "@/components/navbar/navbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],          // body 400
  variable: "--font-body",  // match globals.css variable name
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],              // heading 600
  variable: "--font-heading",   // match globals.css variable name
});

export const metadata: Metadata = {
  title: "Presidency University Cover Page Generator",
  description:
    "Automatically generate Presidency University (PU) cover pages using ready-made templates.",
  keywords: [
    "Presidency University",
    "PU",
    "Presidency University Bangladesh",
    "Cover Page",
    "Assignment Cover Page",
    "PU Cover Generator",
    "University Template",
    "Assignment Template",
  ],
  authors: [{ name: "Shahriar" }],
  openGraph: {
    title: "Presidency University Cover Page Generator",
    description:
      "Generate your PU cover page instantly from multiple modern templates.",
    url: "https://your-domain.com",
    siteName: "Presidency University Cover Page Generator",
    type: "website",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" >
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
