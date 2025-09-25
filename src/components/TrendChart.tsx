import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

export const TrendChart = () => {
  // 模擬6個月的歷史數據
  const data = [
    {
      month: "6月前",
      總分: 29,
      定向力: 9,
      記憶力: 6,
      注意力: 4,
      語言能力: 7,
      視覺空間: 3,
    },
    {
      month: "5月前", 
      總分: 28,
      定向力: 9,
      記憶力: 5,
      注意力: 4,
      語言能力: 7,
      視覺空間: 3,
    },
    {
      month: "4月前",
      總分: 28,
      定向力: 8,
      記憶力: 5,
      注意力: 4,
      語言能力: 8,
      視覺空間: 3,
    },
    {
      month: "3月前",
      總分: 27,
      定向力: 8,
      記憶力: 5,
      注意力: 3,
      語言能力: 8,
      視覺空間: 3,
    },
    {
      month: "2月前",
      總分: 27,
      定向力: 8,
      記憶力: 4,
      注意力: 4,
      語言能力: 8,
      視覺空間: 3,
    },
    {
      month: "1月前",
      總分: 26,
      定向力: 8,
      記憶力: 4,
      注意力: 3,
      語言能力: 8,
      視覺空間: 3,
    },
    {
      month: "本次",
      總分: 26,
      定向力: 9,
      記憶力: 5,
      注意力: 3,
      語言能力: 7,
      視覺空間: 2,
    },
  ];

  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          歷史趨勢分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, 30]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }}
              />
              
              {/* 總分區域圖 */}
              <Area
                type="monotone"
                dataKey="總分"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={3}
              />
              
              {/* 各項能力線條 */}
              <Line
                type="monotone"
                dataKey="定向力"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="記憶力"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="注意力"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="語言能力"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="視覺空間"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-5))", strokeWidth: 2, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 圖例 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span className="text-foreground">總分</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-1"></div>
            <span className="text-foreground">定向力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-2"></div>
            <span className="text-foreground">記憶力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-3"></div>
            <span className="text-foreground">注意力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-4"></div>
            <span className="text-foreground">語言能力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-5"></div>
            <span className="text-foreground">視覺空間</span>
          </div>
        </div>

        {/* 趨勢分析摘要 */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <h4 className="font-semibold text-foreground mb-2">趨勢分析</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>整體趨勢：</strong>過去6個月總分呈現緩慢下降趨勢</p>
            <p>• <strong>主要變化：</strong>記憶力和視覺空間能力有所下降</p>
            <p>• <strong>穩定項目：</strong>定向力和語言能力保持相對穩定</p>
            <p>• <strong>建議：</strong>重點關注記憶訓練和視覺空間練習</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};