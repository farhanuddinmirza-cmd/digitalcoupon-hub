import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCampaigns, mockCoupons, mockActivityLogs } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const statusColor: Record<string, string> = {
  active: 'bg-accent text-accent-foreground',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-secondary text-secondary-foreground',
};

export default function CampaignsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockCampaigns.map(c => {
          const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
          const claimed = coupons.filter(cp => cp.status === 'claimed').length;
          const unclaimed = coupons.filter(cp => cp.status === 'uploaded').length;
          return (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge className={`${statusColor[c.status]} capitalize text-xs`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.brand} · {c.store}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="font-medium">{coupons.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Claimed</span>
                  <span className="font-medium">{claimed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unclaimed</span>
                  <span className="font-medium">{unclaimed}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`); }}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
