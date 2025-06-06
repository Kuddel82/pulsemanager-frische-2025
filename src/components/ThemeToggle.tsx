import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "./ThemeProvider"
import { useTranslation } from "react-i18next"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center gap-2 bg-background hover:bg-accent"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">
        {theme === "light" ? t("theme.dark") : t("theme.light")}
      </span>
    </Button>
  )
} 