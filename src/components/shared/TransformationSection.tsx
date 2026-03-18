import { useCallback, useState } from 'react';
import type { ComponentProps, FC } from 'react';
import { Button } from '@app/components/ui/button';
import { Textarea } from '@app/components/ui/textarea';
import { Check, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@app/components/ui/tooltip';

type TransformationSectionProps = {
  transformCallback: (s: string) => string;
  placeholder?: string;
};

export const TransformationSection: FC<TransformationSectionProps> = ({
  transformCallback,
  placeholder = 'Enter text...',
}) => {
  const [value, setValue] = useState('');
  const [transformedValue, setTransformedValue] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(transformedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [transformedValue]);

  const handleChange = useCallback<NonNullable<ComponentProps<typeof Textarea>['onChange']>>(
    (e) => {
      setValue(e.target.value);
      setCopied(false);
      try {
        setTransformedValue(transformCallback(e.target.value));
      } catch (error) {
        setTransformedValue((error as Error).message);
      }
    },
    [transformCallback]
  );

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-h-20 font-mono text-sm"
      />
      {transformedValue && (
        <div className="flex items-start gap-2">
          <div
            onClick={handleCopy}
            className="flex-1 cursor-pointer overflow-auto break-all rounded-lg bg-muted p-3 font-mono text-sm transition-colors hover:bg-muted/70"
          >
            {transformedValue}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied!' : 'Copy to clipboard'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      )}
    </div>
  );
};
