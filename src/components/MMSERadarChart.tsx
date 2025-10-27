import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Brain } from "lucide-react";

// 介面 (保持不變)
interface MMSEResult {
  test: string;
  score: number;
  maxScore: number;
}

interface MMSERadarChartProps {
  data: MMSEResult[];
}

// 六大領域定義 (保持不變)
const cognitiveDomains = [
  { name: "定向力", tests: ["定向力(時間)", "定向力(地點)"] },
  { name: "記憶力", tests: ["短期記憶", "近期記憶"] },
  { name: "注意、計算", tests: ["注意力"] },
  { name: "語言能力", tests: ["命名", "重複語句", "理解文字", "語句完整度"] },
  { name: "口語理解", tests: ["理解指令"] },
  { name: "視覺空間", tests: ["畫圖"] }
];

// 輔助函式 (保持不變)
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

  // 彙總 6 項資料 (保持不變)
  const domainScores = cognitiveDomains.map(domain => {
    const scores = getDomainScore(domain, data); 
    return {
      subject: domain.name.length > 8 ? domain.name.substring(0, 8) + '...' : domain.name,
      fullName: domain.name,
      A: scores.percentage, 
      fullMark: 100,
      score: scores.score, 
      maxScore: scores.maxScore, 
    };
  });

  // 分組 (保持不變)
  const card1Items = [
    domainScores[1], // 記憶力
    domainScores[3], // 語言能力
    domainScores[5]  // 視覺空間
  ];
  const card2Items = [
    domainScores[0], // 定向力
    domainScores[2], // 注意、計算
    domainScores[4]  // 口語理解
  ];

  return (
  <Card className="shadow-medical border-0">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-primary">
        <Brain className="h-5 w-5" />
        MMSE 測驗結果雷達圖
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* 雷達圖 (保持不變) */}
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
      
  
      {/* --- 重疊卡片區域 --- */}
      <div className="mt-8 flex flex-col md:flex-row md:items-start relative w-full h-[200px] md:h-[250px]">
        
        {/* 左側灰色卡片 */}
        <div 
          className="relative flex flex-col justify-center gap-3 p-4 rounded-xl bg-gray-100 shadow-md 
                     w-full md:w-1/2 h-full z-10 md:mr-[-1rem]"
        >
          {card1Items.map((item, index) => (
            // 【變更】新增 whitespace-nowrap 防止文字換行
            <div key={index} className="flex justify-between items-center px-2 py-1 whitespace-nowrap">
              <span className="text-muted-foreground text-base">{item.fullName}</span>
              <span className="text-primary font-bold text-lg">{item.score}/{item.maxScore}</span>
            </div>
          ))}
        </div>

        {/* 【變更】
          1. 卡片樣式：改為 bg-white/80 (白色/80%透明度) + backdrop-blur-sm (背景模糊)
          2. 移除 text-white
        */}
        <div 
          className="relative flex flex-col justify-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg 
                     w-full md:w-1/2 h-full z-20 md:ml-[4rem] md:mt-0 mt-4" 
        >
          {card2Items.map((item, index) => (
            // 【變更】
            // 1. 新增 whitespace-nowrap 防止文字換行
            // 2. 調整內部文字顏色以適應白色背景
            <div key={index} className="flex justify-between items-center px-2 py-1 whitespace-nowrap">
              <span className="text-muted-foreground text-base">{item.fullName}</span>
              <span className="text-primary font-bold text-lg">{item.score}/{item.maxScore}</span>
            </div>
          ))}
        </div>

      </div>
    </CardContent>
  </Card>
);
};