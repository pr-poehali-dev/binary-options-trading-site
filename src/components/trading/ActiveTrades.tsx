import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ActiveTradesProps {
  trades: Trade[];
  onCloseTrade: (tradeId: string) => void;
}

export const ActiveTrades = ({ trades, onCloseTrade }: ActiveTradesProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon name="Activity" size={20} />
        Активные позиции
      </h3>
      
      {trades.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Inbox" className="mx-auto mb-2" size={48} />
          <p>Нет активных позиций</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map(trade => (
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
                  onClick={() => onCloseTrade(trade.id)}
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
  );
};
