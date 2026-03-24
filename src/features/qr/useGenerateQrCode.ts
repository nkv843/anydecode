import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { generateQrCode } from "./qrCodeUtilities";

export const useGenerateQrCode = () => {
  const [text, setText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // SVG depends only on matrix shape - colors and roundness via CSS vars
  const matrix = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return generateQrCode(text);
    } catch {
      return null;
    }
  }, [text]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement, HTMLTextAreaElement>) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setText(e.target.value), 150);
  };

  return { handleTextChange, matrix };
}