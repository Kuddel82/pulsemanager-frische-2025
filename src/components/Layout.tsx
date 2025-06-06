import { ReactNode } from "react"
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"
import { WalletConnect } from "./WalletConnect"
import { Home, Wallet, BookOpen, Settings, FileText, Zap, Shuffle, TrendingUp } from "lucide-react"
import { Button } from "./ui/button"
import { useTranslation } from "react-i18next"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()

  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div />
              <div className="flex items-center gap-4 ml-auto">
                <nav className="flex items-center gap-2">
                  <ThemeToggle />
                  <LanguageToggle />
                  <WalletConnect />
                </nav>
              </div>
            </div>
          </header>
          <div className="flex">
            {/* Sidebar */}
            <aside className="w-72 min-h-screen bg-[#181a20] flex flex-col shadow-xl border-r border-[#23263a]">
              <div className="flex items-center gap-3 px-8 py-6">
                <img src="/photo_2025-06-03_09-55-04.jpg" alt="Pulse Manager Logo" className="h-9 w-9 rounded-xl shadow" />
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Pulse Manager</span>
                  <p className="text-xs text-foreground -mt-1">{t('home.slogan', 'We will change the world')}</p>
                </div>
              </div>
              <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
                <a href="/" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <Home className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  <span>{t('nav.dashboard')}</span>
                </a>
                <a href="/wallet" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <Wallet className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  <span>{t('nav.wallet')}</span>
                </a>
                <a href="/pulsex" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <Zap className="h-5 w-5 text-pink-400 group-hover:text-pink-300" />
                  <span>{t('wallet.pulsexTab')}</span>
                </a>
                <a href="/bridge" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <Shuffle className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
                  <span>{t('wallet.bridgeTab')}</span>
                </a>
                <a href="/pulsechain-roi" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <TrendingUp className="h-5 w-5 text-green-400 group-hover:text-green-300" />
                  <span>{t('nav.roi')}</span>
                </a>
                <a href="https://dexscreener.com/pulsechain" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8" /></svg>
                  <span>Charts</span>
                </a>
                <a href="/tax-report" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <FileText className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  <span>{t('nav.tax')}</span>
                </a>
                <a href="/learning" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <BookOpen className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  <span>{t('nav.academy')}</span>
                </a>
                <a href="/settings" className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#23263a] transition group">
                  <Settings className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  <span>{t('nav.settings')}</span>
                </a>
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1">
              <main className="p-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </AppProvider>
    </AuthProvider>
  )
} 