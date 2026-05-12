import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return /[,\n"]/.test(str) ? `"${str}"` : str;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadAllXLSX() {
  const endpoints = [
    { name: 'campaigns',     url: '/api/campaigns' },
    { name: 'coupons',       url: '/api/coupons' },
    { name: 'activity_logs', url: '/api/activity' },
  ];
  const wb = XLSX.utils.book_new();
  for (const ep of endpoints) {
    const res  = await fetch(ep.url);
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, ep.name);
    }
  }
  XLSX.writeFile(wb, `coupon_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

interface ExportMenuProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}

export function ExportMenu({ variant = 'outline', size = 'sm' }: ExportMenuProps) {
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  };

  const downloadTable = (url: string, name: string) =>
    run(async () => {
      const res  = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) downloadCSV(data as Record<string, unknown>[], name);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pb-1">
          Download as CSV
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => downloadTable('/api/campaigns', 'campaigns')}>
          Campaigns
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadTable('/api/coupons', 'coupons')}>
          Coupons
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadTable('/api/activity', 'activity_logs')}>
          Activity Logs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => run(downloadAllXLSX)}
          className="font-medium text-primary focus:text-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          All Tables (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
