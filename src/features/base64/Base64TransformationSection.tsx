import { useCallback, useState, } from 'react';
import type { ComponentProps, FC } from 'react';
import { Button } from '@app/components/ui/button';
import { Input } from '@app/components/ui/input';
import { Check, Copy } from 'lucide-react';
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip } from '@app/components/ui/tooltip';

type Base64TransformationSectionProps = {
  title: string,
  transformCallback: (s: string) => string
}

export const Base64TransformationSection: FC<Base64TransformationSectionProps> = ({
  title, transformCallback,
}) => {
  const [value, onValueChange] = useState('');
  const [transformedValue, setTransformedValue] = useState('');
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(() => {
    navigator.clipboard.writeText(transformedValue);
    setCopied(true);
  }, [transformedValue]);

  const onChange = useCallback<NonNullable<ComponentProps<typeof Input>['onChange']>>((e) => {
    onValueChange(e.target.value);
    setCopied(false);
    try {
      setTransformedValue(transformCallback(e.target.value));
    } catch (error) {
      setTransformedValue((error as Error).message);
    }
  }, []);

  return (
    <TooltipProvider>
      <h2>{title}</h2>
      <div className="flex flex-col gap-4">
        <Input value={value} onChange={onChange} />
        <div className="flex">
          <p className="flex-1 max-width">{transformedValue}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onClick}>
                {copied ? <Check color="black" /> : <Copy color="black" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className='bg-black text-white'>
              {copied ? 'Copied' : 'Copy to clipboard'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}