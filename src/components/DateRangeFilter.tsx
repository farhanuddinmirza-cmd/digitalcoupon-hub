import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

interface Preset {
  label: string;
  days: number;
}

const PRESETS: Preset[] = [
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 15 days', days: 15 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function makeRange(days: number): DateRange {
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  return { from, to };
}

function matchPreset(value: DateRange | null): number | null {
  if (!value) return null;
  for (const p of PRESETS) {
    const r = makeRange(p.days);
    if (r.from === value.from && r.to === value.to) return p.days;
  }
  return -1; // custom
}

interface Props {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen]         = useState(false);
  const [customFrom, setFrom]   = useState('');
  const [customTo, setTo]       = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowCustom(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const matched = matchPreset(value);
  const label = value === null
    ? 'All time'
    : matched === -1
      ? `${value.from} → ${value.to}`
      : PRESETS.find(p => p.days === matched)?.label ?? 'Custom';

  const selectPreset = (days: number) => {
    onChange(makeRange(days));
    setOpen(false);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      onChange({ from: customFrom, to: customTo });
      setOpen(false);
      setShowCustom(false);
    }
  };

  const openCustom = () => {
    setFrom(value?.from ?? makeRange(30).from);
    setTo(value?.to ?? new Date().toISOString().slice(0, 10));
    setShowCustom(true);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); setShowCustom(false); }}
        className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-input bg-background text-foreground hover:bg-muted/50 transition-colors min-w-[130px] justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
          {/* Presets */}
          {PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => selectPreset(p.days)}
              className={`flex items-center w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${matched === p.days ? 'text-primary font-semibold' : 'text-foreground'}`}
            >
              {p.label}
            </button>
          ))}

          <div className="h-px bg-border/60 my-1" />

          {/* All time */}
          <button
            onClick={() => { onChange(null); setOpen(false); setShowCustom(false); }}
            className={`flex items-center w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${value === null ? 'text-primary font-semibold' : 'text-foreground'}`}
          >
            All time
          </button>

          {/* Custom */}
          {!showCustom ? (
            <button
              onClick={openCustom}
              className={`flex items-center gap-1.5 w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${matched === -1 ? 'text-primary font-semibold' : 'text-foreground'}`}
            >
              <Calendar className="h-3 w-3" /> Custom range…
            </button>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">From</p>
                <Input type="date" value={customFrom} onChange={e => setFrom(e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">To</p>
                <Input type="date" value={customTo} onChange={e => setTo(e.target.value)} className="h-7 text-xs" />
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={applyCustom} disabled={!customFrom || !customTo || customFrom > customTo}>
                Apply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
