import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
// --- 變更: 匯入型別 ---
import { TrendChartDataPoint } from "@/pages/Index";

// --- 變更: 定義 Props ---
interface TrendChartProps {
  data: TrendChartDataPoint[];
}

// --- 變更: 接收 data 作為 prop ---
export const TrendChart = ({ data }: TrendChartProps) => {

  // --- 變更: 刪除模擬的 data 陣列 ---
  // const data = [ ... ]; // <-- 已刪除

  // --- 變更: 動態分析趨勢 ---
  const analyzeTrend = () => {
    if (data.length < 2) {
      return {
        overall: "需要更多資料來分析趨勢。",
        details: []
      };
    }
    const latest = data[data.length - 1];
    const previous = data[0]; // 拿第一筆 (最舊的) 來比較

    const changes = {
      overall: latest.總分 - previous.總分,
      memory: latest.記憶力 - previous.記憶力,
      spatial: latest.視覺空間 - previous.視覺空間,
      language: latest.語言能力 - previous.語言能力,
      attention: latest.注意力 - previous.注意力,
    };

    const overallTrend = changes.overall > 0 ? "呈現上升趨勢" : changes.overall < 0 ? "呈現下降趨勢" : "保持穩定";
    
    const details = [];
    if (changes.memory < 0) details.push("記憶力能力有所下降");
    if (changes.spatial < 0) details.push("視覺空間能力有所下降");
    if (changes.language > 0) details.push("語言能力有所提升");
    if (changes.attention < 0) details.push("注意力分數有波動");

    if (details.length === 0 && changes.overall === 0) details.push("各項能力均保持相對穩定");

    return {
      overall: `整體趨勢：過去 ${data.length} 次測驗總分 ${overallTrend}`,
      details: details
    };
  };

  const analysis = analyzeTrend();

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
            {/* 判斷：如果有資料才顯示圖表 */}
            {data.length > 0 ? (
              <AreaChart
                width={500}
                height={300}
                data={data} // <-- 使用傳入的 data
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
                
                <Area
                  type="monotone"
                  dataKey="總分"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={3}
                  connectNulls={true}
                />
                
                {/* 各項能力線條 */}
                <Line type="monotone" dataKey="定向力" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} connectNulls={true}/>
                <Line type="monotone" dataKey="記憶力" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} connectNulls={true}/>
                <Line type="monotone" dataKey="注意力" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} connectNulls={true}/>
                <Line type="monotone" dataKey="語言能力" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} connectNulls={true}/>
                <Line type="monotone" dataKey="視覺空間" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} connectNulls={true}/>
              </AreaChart>
            ) : (
              // 如果沒有資料，顯示提示
              <div className="flex items-center justify-center h-full text-muted-foreground">
                歷史資料不足，無法繪製趨勢圖
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* 圖例 (保持不變) */}
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

        {/* --- 變更: 趨勢分析摘要改為動態產生 --- */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <h4 className="font-semibold text-foreground mb-2">趨勢分析</h4>
          {data.length > 0 ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>{analysis.overall}</strong></p>
              {analysis.details.map((detail, index) => (
                <p key={index}>• {detail}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">尚無足夠資料可供分析。</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};