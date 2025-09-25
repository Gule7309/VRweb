import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Brain } from "lucide-react";

interface MMSEResult {
  test: string;
  score: number;
  maxScore: number;
}

interface MMSERadarChartProps {
  data: MMSEResult[];
}

export const MMSERadarChart = ({ data }: MMSERadarChartProps) => {
  // 轉換數據為雷達圖格式，計算百分比
  const radarData = data.map(item => ({
    subject: item.test.length > 8 ? item.test.substring(0, 8) + '...' : item.test,
    fullName: item.test,
    A: (item.score / item.maxScore) * 100,
    fullMark: 100,
    score: item.score,
    maxScore: item.maxScore,
  }));

  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-5 w-5" />
          MMSE 測驗結果雷達圖
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeWidth={1}
              />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ 
                  fontSize: 12, 
                  fill: "hsl(var(--foreground))",
                  textAnchor: "middle"
                }}
                className="text-xs"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ 
                  fontSize: 10, 
                  fill: "hsl(var(--muted-foreground))"
                }}
                tickCount={6}
              />
              <Radar
                name="測驗表現"
                dataKey="A"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ 
                  fill: "hsl(var(--primary))", 
                  strokeWidth: 2, 
                  r: 4 
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with detailed scores */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
              <span className="text-foreground font-medium">{item.test}</span>
              <span className="text-primary font-bold">
                {item.score}/{item.maxScore}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};