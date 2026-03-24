import { useRef, useState } from 'react';
import { Textarea } from '@app/components/ui/textarea';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Button } from '@app/components/ui/button';
import { Slider } from '@app/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@app/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@app/components/ui/dialog';
import { ColorPicker } from './ColorPicker';
import { QrCodeSvg } from './QRCode';
import { exportPng } from './utils';
import { useGenerateQrCode } from './useGenerateQrCode';

interface QrStyle {
  foreground: string;
  background: string;
  borderRadius: number;
}

const PRESETS: { name: string; style: QrStyle }[] = [
  { name: 'Classic', style: { foreground: '#000000', background: '#ffffff', borderRadius: 0 } },
  { name: 'Soft', style: { foreground: '#1f2937', background: '#f9fafb', borderRadius: 30 } },
  { name: 'Ocean', style: { foreground: '#0369a1', background: '#e0f2fe', borderRadius: 20 } },
  { name: 'Extenda', style: { foreground: '#42161e', background: '#ffdbe6', borderRadius: 35 } },
  { name: 'Sunset', style: { foreground: '#c2410c', background: '#fff7ed', borderRadius: 15 } },
  { name: 'Night', style: { foreground: '#e2e8f0', background: '#1e293b', borderRadius: 10 } },
];

export const QrTools = () => {
  const { matrix, handleTextChange } = useGenerateQrCode()
  const [borderRadius, setBorderRadius] = useState(0);
  const [exportSize, setExportSize] = useState(512);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateBorderRadius = (v: number) => {
    document.documentElement.style.setProperty('--qr-rx', String(v / 100));
    setBorderRadius(v);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    document.documentElement.style.setProperty('--qr-fg', preset.style.foreground);
    document.documentElement.style.setProperty('--qr-bg', preset.style.background);
    updateBorderRadius(preset.style.borderRadius);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground">Text</Label>
        <Textarea
          ref={textareaRef}
          placeholder="Enter text or URL to generate QR code..."
          defaultValue=""
          onChange={handleTextChange}
          className="min-h-20 font-mono text-sm"
        />
      </div>

      <div className="flex gap-8">
        {/* Left: Controls */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Presets */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="gap-2"
                >
                  <div className="flex -space-x-1">
                    <div
                      className="h-3 w-3 rounded-full border border-background"
                      style={{ backgroundColor: preset.style.foreground }}
                    />
                    <div
                      className="h-3 w-3 rounded-full border border-background"
                      style={{ backgroundColor: preset.style.background }}
                    />
                  </div>
                  <span>{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Style</Label>
            <div className="flex flex-wrap items-center gap-2">
              <ColorPicker cssVar="--qr-fg" label="Foreground" />
              <ColorPicker cssVar="--qr-bg" label="Background" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div
                      className="h-4 w-4 bg-foreground"
                      style={{ borderRadius: `${borderRadius}%` }}
                    />
                    <span className="text-xs">Roundness</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Roundness</Label>
                      <span className="text-xs text-muted-foreground">{borderRadius}%</span>
                    </div>
                    <Slider
                      value={[borderRadius]}
                      onValueChange={([v]) => updateBorderRadius(v)}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export */}
          {matrix && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Export</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-fit">
                    Export PNG
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Export QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Size (px)</Label>
                      <Input
                        value={exportSize}
                        onChange={(e) => setExportSize(Number(e.target.value))}
                      />
                    </div>
                    <Button onClick={() => exportPng(matrix, exportSize)}>Download</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        {matrix && (
          <div className="shrink-0">
            <div className="rounded-xl bg-(--qr-bg) p-6 shadow-sm [&_svg]:size-64">
              <QrCodeSvg matrix={matrix} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};