import { Button } from "./ui/button"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

export function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className="flex items-center gap-2 bg-background hover:bg-accent"
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline-block">
        {i18n.language === 'de' ? 'DE' : 'EN'}
      </span>
    </Button>
  )
} 