"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import logoImage from "../../../public/pubcoverletter.png"

interface NavLink {
  label: string
  href: string
}

interface NavbarProps {
  links?: NavLink[]
  brand?: string
  logo?: string
}

export function Navbar({
  links = [
    { label: "Cover Page", href: "/" },
    { label: "Resume Builder", href: "/resume-builder" },
    { label: "Web Share", href: "/web-share" },
    { label: "AI Resume Analyzer", href: "/ai-resume-analyzer" },
  ]
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand/Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Image src={logoImage} alt="Logo" width={50} height={50} className="rounded" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center gap-8 mx-auto">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-black px-3 py-2 text-[18px] font-medium transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Contact Button */}
<div className="hidden md:flex items-center gap-4">
  <Link href="/feed-back">
    <Button
      className="bg-[#9e1d21] text-white text-[18px] px-10 py-5 rounded-md shadow-sm hover:bg-[#82171a] transition"
    >
      Feedback
    </Button>
  </Link>
</div>


          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 md:hidden" onClick={() => setIsOpen(false)} style={{ top: 64 }} />
      )}

      {/* Mobile Drawer with slide animation */}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white text-black transform transition-transform duration-300 ease-in-out md:hidden flex flex-col border-r border-gray-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 pt-8 pb-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact Button */}
        <div className="border-t border-gray-200 px-2 py-12">
            <Link href="/feed-back">
            <Button
            className="w-full bg-[#9e1d21] text-white hover:bg-[#82171a]"
          >
            Feedback
          </Button>
            </Link>
        </div>
      </div>
    </nav>
  )
}
