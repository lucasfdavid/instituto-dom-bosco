export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </main>
    </div>
  )
}
