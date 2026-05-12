import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

type Preset = '7d' | '30d' | '90d';

function presetRange(p: Preset): DateRange {
  const to = new Date().toISOString().slice(0, 10);
  const days = p === '7d' ? 7 : p === '30d' ? 30 : 90;
  const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  return { from, to };
}

function matchesPreset(value: DateRange | null, p: Preset) {
  if (!value) return false;
  const r = presetRange(p);
  return r.from === value.from && r.to === value.to;
}

interface Props {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [cFrom, setCFrom] = useState('');
  const [cTo, setCTo] = useState('');

  const isCustom = value !== null && !(['7d', '30d', '90d'] as Preset[]).some(p => matchesPreset(value, p));

  const openCustom = () => {
    setCFrom(value?.from ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
    setCTo(value?.to ?? new Date().toISOString().slice(0, 10));
    setCustomOpen(true);
  };

  const applyCustom = () => {
    if (cFrom && cTo && cFrom <= cTo) {
      onChange({ from: cFrom, to: cTo });
      setCustomOpen(false);
    }
  };

  const btnCls = (active: boolean) =>
    cn('h-7 px-2.5 text-xs rounded-md border transition-colors',
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background text-muted-foreground border-input hover:bg-muted/50');

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button className={btnCls(value === null)} onClick={() => { onChange(null); setCustomOpen(false); }}>
        All time
      </button>
      {(['7d', '30d', '90d'] as Preset[]).map(p => (
        <button key={p} className={btnCls(matchesPreset(value, p))}
          onClick={() => { onChange(presetRange(p)); setCustomOpen(false); }}>
          {p}
        </button>
      ))}

      {customOpen ? (
        <div className="flex items-center gap-1.5">
          <Input type="date" value={cFrom} onChange={e => setCFrom(e.target.value)} className="h-7 text-xs w-[130px]" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={cTo} onChange={e => setCTo(e.target.value)} className="h-7 text-xs w-[130px]" />
          <Button size="sm" className="h-7 text-xs px-2.5" onClick={applyCustom} disabled={!cFrom || !cTo || cFrom > cTo}>Apply</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCustomOpen(false)}>✕</Button>
        </div>
      ) : (
        <button className={btnCls(isCustom)} onClick={openCustom}>
          <Calendar className="h-3 w-3 mr-1 inline" />
          {isCustom ? `${value!.from} → ${value!.to}` : 'Custom'}
        </button>
      )}
    </div>
  );
}
