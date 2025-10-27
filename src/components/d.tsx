import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Brain } from "lucide-react";

// 介面：定義傳入的 props (保持不變，仍然是 11 項)
interface MMSEResult {
  test: string;
  score: number;
  maxScore: number;
}

interface MMSERadarChartProps {
  data: MMSEResult[];
}

// --- 變更 1: 複製 CognitiveScoreCards.tsx 中的六大領域定義 ---
const cognitiveDomains = [
  { name: "定向力", tests: ["定向力(時間)", "定向力(地點)"] },
  { name: "記憶力", tests: ["短期記憶", "近期記憶"] },
  { name: "注意、計算", tests: ["注意力"] },
  { name: "語言能力", tests: ["命名", "重複語句", "理解文字", "語句完整度"] },
  { name: "口語理解", tests: ["理解指令"] },
  { name: "視覺空間", tests: ["畫圖"] }
];

// --- 變更 2: 建立一個輔助函式來計算領域分數 ---
// (這個函式是 component-local 的，不會匯出)
const getDomainScore = (domain: typeof cognitiveDomains[0], allScores: MMSEResult[]) => {
  const domainTests = allScores.filter(score =>
    domain.tests.some(test => score.test.includes(test))
  );

  const totalScore = domainTests.reduce((sum, test) => sum + (test.score ?? 0), 0);
  const totalMaxScore = domainTests.reduce((sum, test) => sum + test.maxScore, 0);

  return {
    score: totalScore,
    maxScore: totalMaxScore,
    percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
  };
};


export const MMSERadarChart = ({ data }: MMSERadarChartProps) => {

  // --- 變更 3: 處理資料，將 11 項彙總為 6 項 ---
  // 我們不再直接使用 data prop，而是處理它
  const domainScores = cognitiveDomains.map(domain => {
    const scores = getDomainScore(domain, data); // 'data' 是傳入的 11 項 MmseResults

    return {
      subject: domain.name.length > 8 ? domain.name.substring(0, 8) + '...' : domain.name,
      fullName: domain.name,
      A: scores.percentage, // 百分比，用於雷達圖
      fullMark: 100,
      score: scores.score, // 彙總後的分數，用於 Legend
      maxScore: scores.maxScore, // 彙總後的滿分，用於 Legend
    };
  });
  // 'domainScores' 現在是一個包含 6 個物件的陣列

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
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={domainScores}>
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
      
  
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {domainScores.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
              <span className="text-foreground font-medium">{item.fullName}</span>
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