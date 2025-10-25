import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, MessageSquare, Map, Clock, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

// --- 變更 1: 修改介面 ---
interface MMSEResult {
  test: string;
  score: number;
  maxScore: number;
  // audioUrl?: string; // 舊的
  audioUrls?: string[]; // <-- 新的：改為字串陣列
  imageUrl?: string;
  description?: string;
}
// --- 變更結束 ---

interface CognitiveScoreCardsProps {
  scores: MMSEResult[];
}

export const CognitiveScoreCards = ({ scores }: CognitiveScoreCardsProps) => {
  // 認知功能分域 (保持不變)
  const cognitiveDomains = [
    {
      name: "定向力",
      icon: Map,
      tests: ["定向力(時間)", "定向力(地點)"],
      color: "text-chart-1",
      bgColor: "bg-chart-1/10"
    },
    {
      name: "記憶力",
      icon: Brain,
      tests: ["短期記憶", "近期記憶"],
      color: "text-chart-2", 
      bgColor: "bg-chart-2/10"
    },
    {
      name: "注意力與計算",
      icon: Clock,
      tests: ["注意力"], // 您的 "注意力" 對應 level_7
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    {
      name: "語言能力",
      icon: MessageSquare,
      tests: ["命名", "重複語句", "理解指令", "理解文字", "語句完整度"],
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
    {
      name: "視覺空間",
      icon: Eye,
      tests: ["畫圖"],
      color: "text-chart-5",
      bgColor: "bg-chart-5/10"
    }
  ];

  // (getDomainScore 和 getScoreStatus 函式保持不變)
  const getDomainScore = (domain: typeof cognitiveDomains[0]) => {
    const domainTests = scores.filter(score => 
      domain.tests.some(test => score.test.includes(test))
    );
    
    const totalScore = domainTests.reduce((sum, test) => sum + test.score, 0);
    const totalMaxScore = domainTests.reduce((sum, test) => sum + test.maxScore, 0);
    
    return {
      score: totalScore,
      maxScore: totalMaxScore,
      percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
      tests: domainTests
    };
  };

  const getScoreStatus = (percentage: number) => {
    if (percentage >= 80) return { status: "優秀", color: "bg-success text-white" };
    if (percentage >= 60) return { status: "正常", color: "bg-warning text-white" };
    return { status: "需關注", color: "bg-destructive text-white" };
  };

  return (
    <Card className="shadow-medical border-0">
      {/* (CardHeader 保持不變) */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-5 w-5" />
          認知功能分域評估
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* (grid div 保持不變) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cognitiveDomains.map((domain, index) => {
            const domainScore = getDomainScore(domain);
            const status = getScoreStatus(domainScore.percentage);
            const IconComponent = domain.icon;

            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${domain.bgColor} border-current/20 transition-all hover:shadow-md`}
              >
                {/* (domain header 保持不變) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${domain.color}`} />
                    <h3 className="font-semibold text-sm text-foreground">{domain.name}</h3>
                  </div>
                  <Badge className={status.color} variant="secondary">
                    {status.status}
                  </Badge>
                </div>

                {/* (domain score/progress 保持不變) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">
                      {domainScore.score}/{domainScore.maxScore}
                    </span>
                    <span className={`text-sm font-medium ${domain.color}`}>
                      {Math.round(domainScore.percentage)}%
                    </span>
                  </div>
                  <Progress 
                    value={domainScore.percentage} 
                    className="h-2"
                  />

                  {/* (Dialog 區塊) */}
                  <div className="mt-3 space-y-1">
                    {domainScore.tests.map((test, testIndex) => (
                      <Dialog key={testIndex}>
                        {/* (DialogTrigger 保持不變) */}
                        <DialogTrigger asChild>
                          <div className="flex justify-between items-center text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors group">
                            <span className="truncate pr-1 group-hover:underline" title={test.test}>
                              {test.test.length > 12 ? test.test.substring(0, 12) + '...' : test.test}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {test.score}/{test.maxScore}
                              </span>
                              <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
                          {/* (DialogHeader 保持不變) */}
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="text-2xl">{test.test}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[calc(90vh-100px)] px-6">
                            <div className="space-y-6 pb-6">
                              {/* (分數顯示 保持不變) */}
                              <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                                <div className="text-center">
                                  <div className="text-4xl font-bold text-primary">
                                    {test.score}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">得分</div>
                                </div>
                                <div className="text-3xl text-muted-foreground">/</div>
                                <div className="text-center">
                                  <div className="text-4xl font-bold text-muted-foreground">
                                    {test.maxScore}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">滿分</div>
                                </div>
                                <div className="flex-1 ml-6">
                                  <Progress 
                                    value={(test.score / test.maxScore) * 100} 
                                    className="h-4"
                                  />
                                  <div className="text-right mt-2 text-sm font-medium text-primary">
                                    {Math.round((test.score / test.maxScore) * 100)}%
                                  </div>
                                </div>
                              </div>

                              {/* (描述 保持不變) */}
                              {test.description && (
                                <div className="p-4 bg-accent/10 rounded-lg">
                                  <h4 className="font-semibold mb-2 text-foreground">測驗表現</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{test.description}</p>
                                </div>
                              )}

                              {/* (圖片 保持不變) */}
                              {test.imageUrl && (
                                <div>
                                  <h4 className="font-semibold mb-3 text-foreground">測驗畫面</h4>
                                  <img 
                                    src={test.imageUrl} 
                                    alt={test.test}
                                    className="w-full rounded-lg shadow-lg border"
                                  />
                                </div>
                              )}

                              {/* --- 變更 2: 修改音檔渲染邏輯 --- */}
                              {test.audioUrls && test.audioUrls.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3 text-foreground">
                                    測驗錄音 {test.audioUrls.length > 1 ? `(共 ${test.audioUrls.length} 筆)` : ''}
                                  </h4>
                                  <div className="space-y-3">
                                    {/* 使用 .map() 迴圈來渲染所有音檔 */}
                                    {test.audioUrls.map((url, index) => (
                                      <div key={index}>
                                        {/* 如果有多個音檔，為每個音檔加上標籤 */}
                                        {test.audioUrls.length > 1 && (
                                          <label className="text-sm text-muted-foreground mb-1 block">
                                            {/* 嘗試從 URL 中擷取檔名，如果失敗則顯示 錄音 x */}
                                            {url.split('%2F').pop()?.split('?')[0].replace('減法運算_', '').replace('.wavData', '') || `錄音 ${index + 1}`}
                                          </label>
                                        )}
                                        <audio 
                                          controls 
                                          className="w-full"
                                          preload="metadata"
                                        >
                                          <source src={url} type="audio/mpeg" />
                                          您的瀏覽器不支援音訊播放
                                        </audio>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* --- 變更結束 --- */}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* (整體建議 保持不變) */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2">認知功能分析摘要</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>優勢領域：</strong>定向力表現良好，對時間和空間的認知清晰</p>
            <p>• <strong>需關注領域：</strong>延遲記憶和注意力集中度有待加強</p>
            <p>• <strong>建議：</strong>進行記憶訓練和專注力練習，定期追蹤評估</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};