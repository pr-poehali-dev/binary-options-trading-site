import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AssetData {
  name: string;
  symbol: string;
  price: number;
  volatility: number;
}

interface TradingChartProps {
  selectedAsset: AssetData;
  assets: AssetData[];
  currentPrice: number;
  priceHistory: number[];
  priceChangePercent: string;
  tradeAmount: string;
  onAssetChange: (asset: AssetData) => void;
  onTradeAmountChange: (amount: string) => void;
  onOpenTrade: (type: 'LONG' | 'SHORT') => void;
}

export const TradingChart = ({
  selectedAsset,
  assets,
  currentPrice,
  priceHistory,
  priceChangePercent,
  tradeAmount,
  onAssetChange,
  onTradeAmountChange,
  onOpenTrade
}: TradingChartProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <select 
              value={selectedAsset.symbol}
              onChange={(e) => {
                const asset = assets.find(a => a.symbol === e.target.value);
                if (asset) onAssetChange(asset);
              }}
              className="text-xl font-semibold bg-secondary border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {assets.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold">${currentPrice.toFixed(selectedAsset.symbol.includes('XRP') || selectedAsset.symbol.includes('EUR') ? 4 : 2)}</span>
            <Badge variant={parseFloat(priceChangePercent) >= 0 ? "default" : "destructive"} className={parseFloat(priceChangePercent) >= 0 ? "bg-green-600" : ""}>
              {parseFloat(priceChangePercent) >= 0 ? '+' : ''}{priceChangePercent}%
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Icon name="TrendingUp" size={20} />
          </Button>
          <Button variant="outline" size="icon">
            <Icon name="BarChart3" size={20} />
          </Button>
        </div>
      </div>

      <div className="h-64 bg-secondary/50 rounded-lg relative overflow-hidden">
        <svg className="w-full h-full">
          {priceHistory.length > 1 && (
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              points={priceHistory.map((price, i) => {
                const x = (i / (priceHistory.length - 1)) * 100;
                const minPrice = Math.min(...priceHistory);
                const maxPrice = Math.max(...priceHistory);
                const y = 100 - ((price - minPrice) / (maxPrice - minPrice)) * 80;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
          )}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9b87f5" />
              <stop offset="100%" stopColor="#7E69AB" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <Label htmlFor="amount" className="text-sm text-muted-foreground">Сумма сделки (USDT)</Label>
          <Input
            id="amount"
            type="number"
            value={tradeAmount}
            onChange={(e) => onTradeAmountChange(e.target.value)}
            className="mt-2 bg-secondary border-border"
            placeholder="100"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            onClick={() => onOpenTrade('LONG')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold animate-pulse-green"
            size="lg"
          >
            <Icon name="TrendingUp" className="mr-2" size={20} />
            LONG
          </Button>
          <Button
            onClick={() => onOpenTrade('SHORT')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold animate-pulse-red"
            size="lg"
          >
            <Icon name="TrendingDown" className="mr-2" size={20} />
            SHORT
          </Button>
        </div>
      </div>
    </Card>
  );
};
