import { useRef } from 'react';
import { Button } from '@app/components/ui/button';

const getVar = (cssVar: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

export const ColorPicker = ({ cssVar, label }: { cssVar: string, label: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.documentElement.style.setProperty(cssVar, e.target.value);
  };

  const openPicker = () => {
    if (inputRef.current) {
      inputRef.current.value = getVar(cssVar) || '#000000';
      inputRef.current.click();
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={openPicker}>
      <input
        ref={inputRef}
        type="color"
        onChange={handleChange}
        className="sr-only"
      />
      <div
        className="h-4 w-4 rounded-full border border-border"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
