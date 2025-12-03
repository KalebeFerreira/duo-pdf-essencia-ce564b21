import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Instagram, Facebook } from "lucide-react";
import CatalogSectionCard from "./CatalogSectionCard";

interface CatalogContactsSectionProps {
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  onWhatsappChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
  onFacebookChange: (value: string) => void;
  dragHandleProps?: any;
}

const CatalogContactsSection = ({
  whatsapp,
  email,
  instagram,
  facebook,
  onWhatsappChange,
  onEmailChange,
  onInstagramChange,
  onFacebookChange,
  dragHandleProps,
}: CatalogContactsSectionProps) => {
  return (
    <CatalogSectionCard
      title="Contatos e Redes Sociais"
      icon={<Phone className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              WhatsApp
            </Label>
            <Input
              value={whatsapp || ''}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              E-mail
            </Label>
            <Input
              type="email"
              value={email || ''}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="email@exemplo.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" />
              Instagram
            </Label>
            <Input
              value={instagram || ''}
              onChange={(e) => onInstagramChange(e.target.value)}
              placeholder="@seuusuario"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-700" />
              Facebook
            </Label>
            <Input
              value={facebook || ''}
              onChange={(e) => onFacebookChange(e.target.value)}
              placeholder="facebook.com/suapagina"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogContactsSection;
