import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TradingChart } from '@/components/trading/TradingChart';
import { ActiveTrades } from '@/components/trading/ActiveTrades';
import { StatsSidebar } from '@/components/trading/StatsSidebar';

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
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const handleTBankPayment = async () => {
    if (!depositAmount || parseFloat(depositAmount) < 100) {
      toast.error('Минимальная сумма пополнения: 100 ₽');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await fetch('https://functions.poehali.dev/7023e463-c750-4398-8c69-faa3b6184e07', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'user_' + Date.now()
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount)
        })
      });

      const data = await response.json();

      if (data.success && data.paymentData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://securepay.tinkoff.ru/rest/Init';
        form.style.display = 'none';

        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        toast.error(data.error || 'Ошибка создания платежа');
      }
    } catch (error) {
      toast.error('Ошибка соединения с платёжной системой');
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
            <TradingChart
              selectedAsset={selectedAsset}
              assets={ASSETS}
              currentPrice={currentPrice}
              priceHistory={priceHistory}
              priceChangePercent={priceChangePercent}
              tradeAmount={tradeAmount}
              onAssetChange={setSelectedAsset}
              onTradeAmountChange={setTradeAmount}
              onOpenTrade={openTrade}
            />

            <ActiveTrades
              trades={activeTrades}
              onCloseTrade={closeTrade}
            />
          </div>

          <StatsSidebar
            trades={trades}
            activeTrades={activeTrades}
            closedTrades={closedTrades}
            totalProfit={totalProfit}
            winRate={winRate}
            isDemoMode={isDemoMode}
            realBalance={realBalance}
            depositAmount={depositAmount}
            isProcessingPayment={isProcessingPayment}
            onDepositAmountChange={setDepositAmount}
            onTBankPayment={handleTBankPayment}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
