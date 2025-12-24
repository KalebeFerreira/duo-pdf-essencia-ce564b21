import { Link } from "react-router-dom";
import { Mail, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
              <img src={logo} alt="Essência-duo" className="w-10 h-10 rounded-lg" />
              <span>Essência-duo</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A forma mais simples de criar documentos profissionais com automação de IA.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Recursos
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Começar
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Documentação
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Essência-duo. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center gap-4">
              <a 
                href="mailto:contato@essenciaduopdf.com" 
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <span 
                className="text-muted-foreground hover:text-primary transition-colors duration-300 cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </span>
              <span 
                className="text-muted-foreground hover:text-primary transition-colors duration-300 cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;