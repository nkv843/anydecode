import { useCallback, useState } from 'react';
import { Textarea } from '@app/components/ui/textarea';

type JwtParts = {
  header: string;
  payload: string;
  signature: string;
};

const decodeJwt = (token: string): JwtParts | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.stringify(JSON.parse(atob(parts[0])), null, 2);
    const payload = JSON.stringify(JSON.parse(atob(parts[1])), null, 2);
    const signature = parts[2];

    return { header, payload, signature };
  } catch {
    return null;
  }
};

export const JwtTools = () => {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState('');

  const handleTokenChange = useCallback((value: string) => {
    setToken(value);
    if (!value.trim()) {
      setDecoded(null);
      setError('');
      return;
    }

    const result = decodeJwt(value.trim());
    if (result) {
      setDecoded(result);
      setError('');
    } else {
      setDecoded(null);
      setError('Invalid JWT token');
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Token</h2>
        <Textarea
          placeholder="Paste your JWT token here..."
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          className="min-h-20 font-mono text-sm"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {decoded && (
        <>
          <div className="h-px bg-border" />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Header</h2>
              <pre className="overflow-auto rounded-lg bg-muted p-3 font-mono text-sm">{decoded.header}</pre>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Payload</h2>
              <pre className="overflow-auto rounded-lg bg-muted p-3 font-mono text-sm">{decoded.payload}</pre>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <h2 className="text-sm font-medium text-muted-foreground">Signature</h2>
              <p className="overflow-auto break-all rounded-lg bg-muted p-3 font-mono text-sm">{decoded.signature}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
