import Link from 'next/link'

interface BlogNavProps {
  lang?: 'pt-BR' | 'en'
}

export function BlogNav({ lang = 'pt-BR' }: BlogNavProps) {
  return (
    <nav className="border-b-2 border-black bg-cream sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="https://trychattie.com" className="flex items-center gap-3">
          <span className="font-black text-xl tracking-tight">Chattie</span>
          <span className="text-sm border-2 border-black px-2 py-0.5 font-bold bg-lavender">Blog</span>
        </Link>
        <div className="flex items-center gap-4">
          {lang === 'pt-BR' ? (
            <span className="text-xs font-bold border border-black px-2 py-0.5 bg-orange">🇧🇷 PT-BR</span>
          ) : (
            <span className="text-xs font-bold border border-black px-2 py-0.5 bg-cyan">🇺🇸 EN</span>
          )}
          <Link
            href="https://trychattie.com"
            className="text-sm font-bold border-2 border-black px-4 py-2 bg-rust text-cream hover:bg-orange hover:text-black transition-colors"
          >
            Conhecer o Chattie →
          </Link>
        </div>
      </div>
    </nav>
  )
}
