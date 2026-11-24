import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy, Loader2, X } from 'lucide-react';
import { Button } from '@app/components/ui/button';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/components/ui/tooltip';
import { cn } from '@app/lib/utils';
import {
  countLines,
  generateDefaultValuesFromSchema,
  parseJsonSchemaInput,
  type GenerateDefaultsResult,
} from './generateDefaults';
import {
  DEFAULT_TYPESCRIPT_FLAGS,
  TYPESCRIPT_FLAG_ITEMS,
  generateTypeScriptFromSchema,
  type GenerateTypeScriptResult,
  type TypeScriptFlagKey,
  type TypeScriptFlags,
} from './generateTypescript';

export const JsonSchemaTools = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parsedSchemaRef = useRef<Record<string, unknown> | null>(null);
  const parseRunIdRef = useRef(0);
  const tsRunIdRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const workTimerRef = useRef<number | null>(null);
  const defaultsCopyTimerRef = useRef<number | null>(null);
  const tsCopyTimerRef = useRef<number | null>(null);

  const [inputLineCount, setInputLineCount] = useState(0);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  const [defaultsResult, setDefaultsResult] = useState<GenerateDefaultsResult>({ status: 'empty' });
  const [isDefaultsExpanded, setIsDefaultsExpanded] = useState(false);
  const [defaultsCopied, setDefaultsCopied] = useState(false);

  const [tsFlags, setTsFlags] = useState<TypeScriptFlags>(DEFAULT_TYPESCRIPT_FLAGS);
  const tsFlagsRef = useRef<TypeScriptFlags>(DEFAULT_TYPESCRIPT_FLAGS);
  const [tsResult, setTsResult] = useState<GenerateTypeScriptResult>({ status: 'empty' });
  const [isTsExpanded, setIsTsExpanded] = useState(false);
  const [tsCopied, setTsCopied] = useState(false);

  const cancelScheduledWork = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (workTimerRef.current !== null) {
      window.clearTimeout(workTimerRef.current);
      workTimerRef.current = null;
    }
  }, []);

  const clearTimer = useCallback((ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelScheduledWork();
      clearTimer(defaultsCopyTimerRef);
      clearTimer(tsCopyTimerRef);
    };
  }, [cancelScheduledWork, clearTimer]);

  const runTypeScriptGeneration = useCallback(
    (schema: Record<string, unknown>, flags: TypeScriptFlags) => {
      const currentTsRunId = ++tsRunIdRef.current;
      setTsResult({ status: 'loading' });
      setTsCopied(false);
      clearTimer(tsCopyTimerRef);

      void generateTypeScriptFromSchema(schema, flags).then((res) => {
        if (tsRunIdRef.current !== currentTsRunId) return;
        setTsResult(res);
      });
    },
    [clearTimer]
  );

  const handleInputChange = useCallback(
    (rawValue: string) => {
      cancelScheduledWork();
      const currentParseRunId = ++parseRunIdRef.current;
      ++tsRunIdRef.current;

      setDefaultsCopied(false);
      setTsCopied(false);
      clearTimer(defaultsCopyTimerRef);
      clearTimer(tsCopyTimerRef);

      if (!rawValue.trim()) {
        parsedSchemaRef.current = null;
        setInputLineCount(rawValue ? countLines(rawValue) : 0);
        setDefaultsResult({ status: 'empty' });
        setTsResult({ status: 'empty' });
        return;
      }

      setInputLineCount(countLines(rawValue));
      setDefaultsResult({ status: 'loading' });
      setTsResult({ status: 'loading' });

      // Yield a paint frame so large pastes render immediately before heavy JSON/schema work runs.
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        workTimerRef.current = window.setTimeout(() => {
          workTimerRef.current = null;
          if (parseRunIdRef.current !== currentParseRunId) return;

          const parsed = parseJsonSchemaInput(rawValue);
          if (parsed.status !== 'valid') {
            parsedSchemaRef.current = null;
            setDefaultsResult(parsed);
            setTsResult(parsed);
            return;
          }

          parsedSchemaRef.current = parsed.schema;
          const defaults = generateDefaultValuesFromSchema(parsed.schema);
          if (parseRunIdRef.current !== currentParseRunId) return;
          setDefaultsResult(defaults);

          runTypeScriptGeneration(parsed.schema, tsFlagsRef.current);
        }, 0);
      });
    },
    [cancelScheduledWork, clearTimer, runTypeScriptGeneration]
  );

  const handleClear = useCallback(() => {
    cancelScheduledWork();
    ++parseRunIdRef.current;
    ++tsRunIdRef.current;
    parsedSchemaRef.current = null;

    if (textareaRef.current) {
      textareaRef.current.value = '';
    }

    setInputLineCount(0);
    setIsInputExpanded(false);
    setDefaultsResult({ status: 'empty' });
    setIsDefaultsExpanded(false);
    setDefaultsCopied(false);
    setTsResult({ status: 'empty' });
    setIsTsExpanded(false);
    setTsCopied(false);
    clearTimer(defaultsCopyTimerRef);
    clearTimer(tsCopyTimerRef);
  }, [cancelScheduledWork, clearTimer]);

  const handleCopyDefaults = useCallback(() => {
    if (defaultsResult.status !== 'success') return;

    void navigator.clipboard.writeText(defaultsResult.output);
    setDefaultsCopied(true);
    clearTimer(defaultsCopyTimerRef);
    defaultsCopyTimerRef.current = window.setTimeout(() => {
      setDefaultsCopied(false);
      defaultsCopyTimerRef.current = null;
    }, 2000);
  }, [clearTimer, defaultsResult]);

  const handleCopyTs = useCallback(() => {
    if (tsResult.status !== 'success') return;

    void navigator.clipboard.writeText(tsResult.output);
    setTsCopied(true);
    clearTimer(tsCopyTimerRef);
    tsCopyTimerRef.current = window.setTimeout(() => {
      setTsCopied(false);
      tsCopyTimerRef.current = null;
    }, 2000);
  }, [clearTimer, tsResult]);

  const handleToggleFlag = useCallback(
    (key: TypeScriptFlagKey) => {
      const nextFlags: TypeScriptFlags = {
        ...tsFlagsRef.current,
        [key]: !tsFlagsRef.current[key],
      };
      tsFlagsRef.current = nextFlags;
      setTsFlags(nextFlags);

      if (parsedSchemaRef.current) {
        runTypeScriptGeneration(parsedSchemaRef.current, nextFlags);
      }
    },
    [runTypeScriptGeneration]
  );

  const hasInput = inputLineCount > 0;
  const hasError = defaultsResult.status === 'error';

  return (
    <div className="flex flex-col gap-5">
      {/* Box 1: JSON Schema input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="json-schema-input" className="text-sm font-medium text-muted-foreground">
              JSON Schema
            </Label>
            {hasInput && (
              <span className="text-xs text-muted-foreground/70">
                {inputLineCount} {inputLineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>

          {hasInput && (
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="xs" onClick={handleClear}>
                <X data-icon="inline-start" />
                Clear
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsInputExpanded((prev) => !prev)}
                aria-expanded={isInputExpanded}
              >
                {isInputExpanded ? (
                  <>
                    <ChevronUp data-icon="inline-start" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown data-icon="inline-start" />
                    Expand
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Textarea
          ref={textareaRef}
          id="json-schema-input"
          defaultValue=""
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste JSON schema here..."
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={hasError}
          className={cn(
            'field-sizing-fixed overflow-y-auto font-mono text-sm',
            isInputExpanded ? 'h-72' : 'h-20'
          )}
        />
      </div>

      <div className="h-px bg-border" />

      {/* Box 2: Generated default value output */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Default Value</span>
            {defaultsResult.status === 'success' && (
              <span className="text-xs text-muted-foreground/70">
                {defaultsResult.lineCount} {defaultsResult.lineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {defaultsResult.status === 'success' && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsDefaultsExpanded((prev) => !prev)}
                aria-expanded={isDefaultsExpanded}
              >
                {isDefaultsExpanded ? (
                  <>
                    <ChevronUp data-icon="inline-start" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown data-icon="inline-start" />
                    Expand
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCopyDefaults}
              disabled={defaultsResult.status !== 'success'}
            >
              {defaultsCopied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {defaultsCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {defaultsResult.status === 'empty' && (
          <div className="flex h-16 items-center rounded-xl border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground">
            Default values will appear here after pasting a JSON schema.
          </div>
        )}

        {defaultsResult.status === 'loading' && (
          <div className="flex h-16 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin shrink-0" />
            <span>Generating default values...</span>
          </div>
        )}

        {defaultsResult.status === 'error' && (
          <div
            role="alert"
            className="flex min-h-16 items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="break-words">{defaultsResult.error}</span>
          </div>
        )}

        {defaultsResult.status === 'success' && !isDefaultsExpanded && (
          <button
            type="button"
            onClick={() => setIsDefaultsExpanded(true)}
            aria-expanded={false}
            className="flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Default value ready</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                Click to inspect <ChevronDown className="size-3.5" />
              </span>
            </span>
            <span className="block w-full truncate font-mono text-xs text-muted-foreground">
              {defaultsResult.preview}
            </span>
          </button>
        )}

        {defaultsResult.status === 'success' && isDefaultsExpanded && (
          <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-sm leading-relaxed text-foreground">
            {defaultsResult.output}
          </pre>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Box 3: Generated TypeScript definition output */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">TypeScript Definition</span>
            {tsResult.status === 'success' && (
              <span className="text-xs text-muted-foreground/70">
                {tsResult.lineCount} {tsResult.lineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {tsResult.status === 'success' && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsTsExpanded((prev) => !prev)}
                aria-expanded={isTsExpanded}
              >
                {isTsExpanded ? (
                  <>
                    <ChevronUp data-icon="inline-start" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown data-icon="inline-start" />
                    Expand
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCopyTs}
              disabled={tsResult.status !== 'success'}
            >
              {tsCopied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {tsCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {tsResult.status === 'empty' && (
          <div className="flex h-16 items-center rounded-xl border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground">
            TypeScript definitions will appear here after pasting a JSON schema.
          </div>
        )}

        {tsResult.status === 'loading' && (
          <div className="flex h-16 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin shrink-0" />
            <span>Generating TypeScript definitions...</span>
          </div>
        )}

        {tsResult.status === 'error' && (
          <div
            role="alert"
            className="flex min-h-16 items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="break-words">{tsResult.error}</span>
          </div>
        )}

        {tsResult.status === 'success' && !isTsExpanded && (
          <button
            type="button"
            onClick={() => setIsTsExpanded(true)}
            aria-expanded={false}
            className="flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                TypeScript definition ready
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                Click to inspect <ChevronDown className="size-3.5" />
              </span>
            </span>
            <span className="block w-full truncate font-mono text-xs text-muted-foreground">
              {tsResult.preview}
            </span>
          </button>
        )}

        {tsResult.status === 'success' && isTsExpanded && (
          <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-sm leading-relaxed text-foreground">
            {tsResult.output}
          </pre>
        )}

        {/* Compiler flag checkboxes */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-0.5">
            {TYPESCRIPT_FLAG_ITEMS.map(({ key, label, description }) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <label className="flex w-fit max-w-full cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={tsFlags[key]}
                      onChange={() => handleToggleFlag(key)}
                      className="size-3.5 shrink-0 cursor-pointer rounded border-input accent-primary"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
