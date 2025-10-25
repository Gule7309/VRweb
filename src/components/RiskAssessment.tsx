import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, TrendingDown, Calendar } from "lucide-react";
// --- 變更: 匯入我們在 Index.tsx 中定義的型別 ---
// (請確認您的路徑別名 '@/' 是否指向 'src' 資料夾)
import { HistoricalTrendData } from "@/pages/Index"; 

// --- 變更: 更新 props 介面 ---
interface RiskAssessmentProps {
  totalScore: number;
  trendData: HistoricalTrendData[]; // <-- 接收真實的歷史資料
}

export const RiskAssessment = ({ totalScore, trendData }: RiskAssessmentProps) => {
  const maxScore = 30;
  const scorePercentage = (totalScore / maxScore) * 100;
  
  // (getRiskLevel 函式保持不變)
  const getRiskLevel = (score: number) => {
    if (score >= 24) return {
      level: "低風險",
      description: "認知功能正常",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      icon: Shield,
      recommendations: [
        "維持規律的生活作息",
        "持續進行腦力訓練",
        "保持社交活動參與",
        "定期健康檢查"
      ]
    };
    
    if (score >= 18) return {
      level: "中風險", 
      description: "輕度認知障礙可能",
      color: "text-warning",
      bgColor: "bg-warning/10", 
      borderColor: "border-warning/20",
      icon: AlertTriangle,
      recommendations: [
        "增加認知訓練頻率",
        "諮詢神經科醫師",
        "加強營養補充",
        "規律運動與睡眠",
        "每3個月追蹤評估"
      ]
    };
    
    return {
      level: "高風險",
      description: "疑似失智症，建議進一步檢查", 
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20", 
      icon: TrendingDown,
      recommendations: [
        "立即諮詢神經科專科醫師",
        "安排腦部影像檢查",
        "評估日常生活能力",
        "考慮藥物治療選項",
        "家屬支持與照護計劃",
        "每月密切追蹤"
      ]
    };
  };

  const riskInfo = getRiskLevel(totalScore);
  const IconComponent = riskInfo.icon;

  // --- 變更: 刪除模擬的 trendData ---
  // const trendData = [ ... ]; // <-- 已刪除

  // --- 變更: 格式化從 props 傳入的真實 trendData ---
  
  // 幫手函式：將 Date 物件格式化為 "X個月前" 或 "本日"
  const formatTrendDate = (date: Date) => {
    const now = new Date();
    // 比較日期，忽略時間
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - compareDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "本日";
    if (diffDays < 30) return `${diffDays}天前`;
    const diffMonths = Math.round(diffDays / 30.44); // 平均月天數
    if (diffMonths <= 12) return `${diffMonths}個月前`;
    const diffYears = Math.round(diffDays / 365.25);
    return `${diffYears}年前`;
  };

  // 將 trendData 轉換為圖表需要的格式 (只取最新的4筆)
  const processedData = trendData.slice(-4);
  const formattedTrendData = processedData.map((data, index) => {
    // 陣列中的最後一筆永遠是 "本次"
    if (index === processedData.length - 1) {
      return { month: "本次", score: data.score };
    }
    return { month: formatTrendDate(data.date), score: data.score };
  });

  // --- 變更: getTrend 函式改用真實資料 ---
  const getTrend = () => {
    // 必須有至少兩筆資料才能比較
    if (trendData.length < 2) {
      return { direction: "新紀錄", color: "text-muted-foreground", icon: "→" };
    }
    const currentScore = trendData[trendData.length - 1].score;
    const prevScore = trendData[trendData.length - 2].score;
    
    if (currentScore > prevScore) return { direction: "上升", color: "text-success", icon: "↗" };
    if (currentScore < prevScore) return { direction: "下降", color: "text-destructive", icon: "↘" };
    return { direction: "穩定", color: "text-muted-foreground", icon: "→" };
  };

  const trend = getTrend();

  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <AlertTriangle className="h-5 w-5" />
          風險評估與建議
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* (風險等級卡片 保持不變) */}
        <div className={`p-4 rounded-lg ${riskInfo.bgColor} border ${riskInfo.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconComponent className={`h-5 w-5 ${riskInfo.color}`} />
              <h3 className="font-bold text-lg text-foreground">{riskInfo.level}</h3>
            </div>
            <Badge className={`${riskInfo.color.replace('text-', 'bg-')} text-white`}>
              {totalScore}/{maxScore} 分
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{riskInfo.description}</p>
          
          <Progress value={scorePercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0分 (高風險)</span>
            <span>30分 (低風險)</span>
          </div>
        </div>

        {/* --- 變更: 趨勢分析現在會顯示真實資料 --- */}
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground">評分趨勢</h4>
            {trendData.length > 0 && ( // 只有在有資料時才顯示趨勢
              <Badge variant="outline" className={`${trend.color} border-current`}>
                {trend.icon} {trend.direction}
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            {/* 使用 formattedTrendData 來渲染 */}
            {formattedTrendData.map((data, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{data.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-border rounded-full h-2">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(data.score / 30) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-foreground w-8">{data.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* (建議事項 保持不變) */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">醫療建議</h4>
          <div className="space-y-2">
            {riskInfo.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* (下次評估提醒 保持不變) */}
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-accent" />
            <span className="font-medium text-foreground">
              建議下次評估時間：
            </span>
            <span className="text-accent">
              {totalScore >= 24 ? "6個月後" : totalScore >= 18 ? "3個月後" : "1個月後"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};