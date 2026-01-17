import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

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

interface StatsSidebarProps {
  trades: Trade[];
  activeTrades: Trade[];
  closedTrades: Trade[];
  totalProfit: number;
  winRate: string;
  isDemoMode: boolean;
  realBalance: number;
  depositAmount: string;
  isProcessingPayment: boolean;
  onDepositAmountChange: (amount: string) => void;
  onTBankPayment: () => void;
}

export const StatsSidebar = ({
  trades,
  activeTrades,
  closedTrades,
  totalProfit,
  winRate,
  isDemoMode,
  realBalance,
  depositAmount,
  isProcessingPayment,
  onDepositAmountChange,
  onTBankPayment
}: StatsSidebarProps) => {
  return (
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
            <div className="space-y-3">
              <Label htmlFor="deposit-amount" className="text-sm text-muted-foreground">
                Сумма пополнения (₽)
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => onDepositAmountChange(e.target.value)}
                className="bg-secondary border-border"
                placeholder="1000"
                min="100"
              />
            </div>
            
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={onTBankPayment}
              disabled={isProcessingPayment || isDemoMode}
            >
              <Icon name="CreditCard" className="mr-2" size={20} />
              {isProcessingPayment ? 'Обработка...' : 'Оплатить через Т-Банк'}
            </Button>
            
            <Button className="w-full" variant="outline" disabled>
              <Icon name="Bitcoin" className="mr-2" size={20} />
              Криптовалюта (скоро)
            </Button>
            
            {isDemoMode && (
              <p className="text-xs text-yellow-500 text-center mt-2">
                ⚠️ Переключитесь на реальный счёт для пополнения
              </p>
            )}
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              Минимальная сумма пополнения: 100 ₽
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
  );
};
