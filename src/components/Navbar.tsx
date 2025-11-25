import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-smooth">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Essência Duo PDF</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/#features" className="text-foreground hover:text-primary transition-smooth">
              Recursos
            </Link>
            <Link to="/create-resume" className="text-foreground hover:text-primary transition-smooth">
              Criar Currículo
            </Link>
            <Link to="/create-ebook" className="text-foreground hover:text-primary transition-smooth">
              Criar Ebook
            </Link>
            <Link to="/pricing" className="text-foreground hover:text-primary transition-smooth">
              Planos
            </Link>
            <Link to="/auth" className="text-foreground hover:text-primary transition-smooth">
              Entrar
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
            <Button asChild className="bg-gradient-primary shadow-glow hover:shadow-xl transition-all">
              <Link to="/auth">Começar Grátis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <Link
              to="/#features"
              className="block py-2 text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Recursos
            </Link>
            <Link
              to="/create-resume"
              className="block py-2 text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Criar Currículo
            </Link>
            <Link
              to="/create-ebook"
              className="block py-2 text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Criar Ebook
            </Link>
            <Link
              to="/pricing"
              className="block py-2 text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Planos
            </Link>
            <Link
              to="/auth"
              className="block py-2 text-foreground hover:text-primary transition-smooth"
              onClick={() => setIsMenuOpen(false)}
            >
              Entrar
            </Link>
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground">Tema</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            </div>
            <Button asChild className="w-full bg-gradient-primary">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                Começar Grátis
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;