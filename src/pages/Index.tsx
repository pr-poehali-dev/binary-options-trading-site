import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Trade {
  id: string;
  type: 'LONG' | 'SHORT';
  asset: string;
  entryPrice: number;
  amount: number;
  timestamp: number;
  profit?: number;
  status: 'active' | 'closed';
  closePrice?: number;
}

interface AssetData {
  name: string;
  symbol: string;
  price: number;
  volatility: number;
}

const ASSETS: AssetData[] = [
  { name: 'Bitcoin', symbol: 'BTC/USDT', price: 102500, volatility: 800 },
  { name: 'Ethereum', symbol: 'ETH/USDT', price: 3850, volatility: 50 },
  { name: 'Ripple', symbol: 'XRP/USDT', price: 2.85, volatility: 0.08 },
  { name: 'Litecoin', symbol: 'LTC/USDT', price: 145, volatility: 5 },
  { name: 'Solana', symbol: 'SOL/USDT', price: 198, volatility: 8 },
  { name: 'Euro', symbol: 'EUR/USD', price: 1.0485, volatility: 0.002 },
  { name: 'Gold', symbol: 'XAU/USD', price: 2850, volatility: 15 },
  { name: 'Oil', symbol: 'WTI/USD', price: 78.5, volatility: 1.2 },
];

const Index = () => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [demoBalance, setDemoBalance] = useState(10000);
  const [realBalance, setRealBalance] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<AssetData>(ASSETS[0]);
  const [currentPrice, setCurrentPrice] = useState(selectedAsset.price);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeAmount, setTradeAmount] = useState('100');

  const balance = isDemoMode ? demoBalance : realBalance;

  useEffect(() => {
    setCurrentPrice(selectedAsset.price);
    setPriceHistory([selectedAsset.price]);
  }, [selectedAsset]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * selectedAsset.volatility * 2;
        const newPrice = prev + change;
        setPriceHistory(history => [...history.slice(-50), newPrice]);
        
        setTrades(prevTrades => 
          prevTrades.map(trade => {
            if (trade.status === 'active') {
              const priceChange = newPrice - trade.entryPrice;
              const profit = trade.type === 'LONG' 
                ? (priceChange / trade.entryPrice) * trade.amount
                : (-priceChange / trade.entryPrice) * trade.amount;
              return { ...trade, profit };
            }
            return trade;
          })
        );
        
        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAsset.volatility]);

  const openTrade = (type: 'LONG' | 'SHORT') => {
    const amount = parseFloat(tradeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму сделки');
      return;
    }

    if (amount > balance) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      type,
      asset: selectedAsset.symbol,
      entryPrice: currentPrice,
      amount,
      timestamp: Date.now(),
      status: 'active',
      profit: 0
    };

    setTrades(prev => [newTrade, ...prev]);
    
    if (isDemoMode) {
      setDemoBalance(prev => prev - amount);
    } else {
      setRealBalance(prev => prev - amount);
    }

    toast.success(`Открыта ${type} позиция на ${amount} USDT`);
  };

  const closeTrade = (tradeId: string) => {
    setTrades(prevTrades => 
      prevTrades.map(trade => {
        if (trade.id === tradeId && trade.status === 'active') {
          const finalProfit = trade.profit || 0;
          const returnAmount = trade.amount + finalProfit;
          
          if (isDemoMode) {
            setDemoBalance(prev => prev + returnAmount);
          } else {
            setRealBalance(prev => prev + returnAmount);
          }
          
          toast.success(`Позиция закрыта. ${finalProfit >= 0 ? 'Прибыль' : 'Убыток'}: ${finalProfit.toFixed(2)} USDT`);
          
          return { 
            ...trade, 
            status: 'closed' as const, 
            closePrice: currentPrice 
          };
        }
        return trade;
      })
    );
  };

  const activeTrades = trades.filter(t => t.status === 'active');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate = closedTrades.length > 0 
    ? (closedTrades.filter(t => (t.profit || 0) > 0).length / closedTrades.length * 100).toFixed(1)
    : '0.0';

  const priceChange = priceHistory.length > 1 
    ? currentPrice - priceHistory[0] 
    : 0;
  const priceChangePercent = priceHistory.length > 1 
    ? (priceChange / priceHistory[0] * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Fedlaxes
            </h1>
            <p className="text-muted-foreground mt-1">Профессиональная торговая платформа</p>
          </div>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center space-x-3">
              <Label htmlFor="demo-mode" className="text-sm font-medium">
                {isDemoMode ? 'Демо режим' : 'Реальный счёт'}
              </Label>
              <Switch
                id="demo-mode"
                checked={isDemoMode}
                onCheckedChange={setIsDemoMode}
              />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold">${balance.toFixed(2)}</span>
              <Badge variant={isDemoMode ? "secondary" : "default"}>
                {isDemoMode ? 'DEMO' : 'LIVE'}
              </Badge>
            </div>
          </Card>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <select 
                      value={selectedAsset.symbol}
                      onChange={(e) => {
                        const asset = ASSETS.find(a => a.symbol === e.target.value);
                        if (asset) setSelectedAsset(asset);
                      }}
                      className="text-xl font-semibold bg-secondary border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                    >
                      {ASSETS.map(asset => (
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
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="mt-2 bg-secondary border-border"
                    placeholder="100"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => openTrade('LONG')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold animate-pulse-green"
                    size="lg"
                  >
                    <Icon name="TrendingUp" className="mr-2" size={20} />
                    LONG
                  </Button>
                  <Button
                    onClick={() => openTrade('SHORT')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold animate-pulse-red"
                    size="lg"
                  >
                    <Icon name="TrendingDown" className="mr-2" size={20} />
                    SHORT
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="Activity" size={20} />
                Активные позиции
              </h3>
              
              {activeTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Inbox" className="mx-auto mb-2" size={48} />
                  <p>Нет активных позиций</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTrades.map(trade => (
                    <div key={trade.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={trade.type === 'LONG' ? "default" : "destructive"} 
                               className={trade.type === 'LONG' ? "bg-green-600" : ""}>
                          {trade.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.asset}</p>
                          <p className="text-sm text-muted-foreground">
                            Вход: ${trade.entryPrice.toFixed(2)} • Сумма: ${trade.amount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${(trade.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(trade.profit || 0) >= 0 ? '+' : ''}{(trade.profit || 0).toFixed(2)} USDT
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {((trade.profit || 0) / trade.amount * 100).toFixed(2)}%
                          </p>
                        </div>
                        <Button 
                          onClick={() => closeTrade(trade.id)}
                          variant="outline"
                          size="sm"
                        >
                          Закрыть
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="PieChart" size={20} />
                Статистика
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Всего сделок</span>
                  <span className="font-semibold">{trades.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Активных</span>
                  <Badge>{activeTrades.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Закрытых</span>
                  <span className="font-semibold">{closedTrades.length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">Прибыль/Убыток</span>
                  <span className={`font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Процент побед</span>
                  <span className="font-semibold">{winRate}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">Пополнение</TabsTrigger>
                  <TabsTrigger value="withdraw">Вывод</TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit" className="space-y-4 mt-4">
                  <Button className="w-full" variant="outline">
                    <Icon name="Bitcoin" className="mr-2" size={20} />
                    Криптовалюта
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Icon name="CreditCard" className="mr-2" size={20} />
                    Банковская карта
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Минимальная сумма пополнения: $10
                  </p>
                </TabsContent>
                
                <TabsContent value="withdraw" className="space-y-4 mt-4">
                  <Input placeholder="Сумма для вывода" type="number" className="bg-secondary border-border" />
                  <Button className="w-full" disabled={!isDemoMode && realBalance === 0}>
                    Вывести средства
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Комиссия за вывод: 1%
                  </p>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="Clock" size={20} />
                История (последние 5)
              </h3>
              
              {closedTrades.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  История пуста
                </div>
              ) : (
                <div className="space-y-2">
                  {closedTrades.slice(0, 5).map(trade => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm">
                      <div>
                        <Badge variant={trade.type === 'LONG' ? "default" : "destructive"} 
                               className={`${trade.type === 'LONG' ? "bg-green-600" : ""} text-xs`}>
                          {trade.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${trade.entryPrice.toFixed(2)} → ${trade.closePrice?.toFixed(2)}
                        </p>
                      </div>
                      <span className={`font-semibold ${(trade.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(trade.profit || 0) >= 0 ? '+' : ''}{(trade.profit || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;