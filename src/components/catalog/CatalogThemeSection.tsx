import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CatalogThemeSectionProps {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onFontChange: (font: string) => void;
}

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
];

const COLOR_PRESETS = [
  { primary: '#3B82F6', secondary: '#1E40AF', name: 'Azul' },
  { primary: '#10B981', secondary: '#047857', name: 'Verde' },
  { primary: '#F59E0B', secondary: '#D97706', name: 'Dourado' },
  { primary: '#EF4444', secondary: '#B91C1C', name: 'Vermelho' },
  { primary: '#8B5CF6', secondary: '#6D28D9', name: 'Roxo' },
  { primary: '#EC4899', secondary: '#BE185D', name: 'Rosa' },
  { primary: '#14B8A6', secondary: '#0D9488', name: 'Turquesa' },
  { primary: '#1F2937', secondary: '#111827', name: 'Escuro' },
];

const CatalogThemeSection = ({
  primaryColor,
  secondaryColor,
  font,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onFontChange,
}: CatalogThemeSectionProps) => {
  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onPrimaryColorChange(preset.primary);
    onSecondaryColorChange(preset.secondary);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Palette className="w-5 h-5" />
          <CardTitle className="text-base">Personalização</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Presets */}
        <div>
          <Label className="text-sm">Paletas de Cores</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="flex flex-col items-center p-2 rounded-lg border hover:border-primary transition-colors"
                title={preset.name}
              >
                <div className="flex">
                  <div
                    className="w-6 h-6 rounded-l"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-r"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Cor Primária</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Cor Secundária</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={secondaryColor}
                onChange={(e) => onSecondaryColorChange(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => onSecondaryColorChange(e.target.value)}
                placeholder="#1E40AF"
              />
            </div>
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <Label className="text-sm">Fonte</Label>
          <Select value={font} onValueChange={onFontChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border" style={{ fontFamily: font }}>
          <div
            className="text-lg font-bold mb-2"
            style={{ color: primaryColor }}
          >
            Pré-visualização
          </div>
          <div
            className="text-sm"
            style={{ color: secondaryColor }}
          >
            Texto secundário com a fonte {font}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogThemeSection;
