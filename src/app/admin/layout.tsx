export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <aside className="w-64 bg-gray-900 text-white p-4">
          Admin Sidebar
        </aside>

        <main className="flex-1 p-6 bg-gray-100">
          {children}
        </main>
      </body>
    </html>
  );
}
