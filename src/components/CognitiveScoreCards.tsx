import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
// --- 1. 匯入新的圖示 ---
import { Brain, Eye, MessageSquare, Map, Clock, Info, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// (移除 Button, 因為沒用到)
import { ScrollArea } from "@/components/ui/scroll-area";
// (移除 useState, 因為沒用到)

// 介面 (保持不變)
interface MMSEResult {
  test: string;
  score: number;
  maxScore: number;
  audioUrls?: string[];
  imageUrl?: string;
  description?: string;
}

interface CognitiveScoreCardsProps {
  scores: MMSEResult[];
}

export const CognitiveScoreCards = ({ scores }: CognitiveScoreCardsProps) => {
  // --- 2. 修改認知功能分域 ---
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
      name: "注意、計算",
      icon: Clock,
      tests: ["注意力"],
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    {
      name: "語言能力",
      icon: MessageSquare,
      // 從這裡移除 "理解指令"
      tests: ["命名", "重複語句", "理解文字", "語句完整度"],
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
    // --- 新增的分域 ---
    {
      name: "口語理解", // 新名稱
      icon: Activity,             // 新圖示
      tests: ["理解指令"],          // 加入 "理解指令"
      color: "text-chart-6",      // 使用新的顏色 (假設您有定義 chart-6)
      bgColor: "bg-chart-6/10"
    },
    // --- 結束新增 ---
    {
      name: "視覺空間",
      icon: Eye,
      tests: ["畫圖"],
      color: "text-chart-5",
      bgColor: "bg-chart-5/10"
    }
  ];
  // --- 修改結束 ---

  // (getDomainScore 和 getScoreStatus 函式保持不變)
  const getDomainScore = (domain: typeof cognitiveDomains[0]) => {
    // 這個函式會自動處理新的分域，因為它是基於 tests 陣列來篩選的
    const domainTests = scores.filter(score =>
      domain.tests.some(test => score.test.includes(test))
    );

    const totalScore = domainTests.reduce((sum, test) => sum + (test.score ?? 0), 0); // Handle potential undefined score
    const totalMaxScore = domainTests.reduce((sum, test) => sum + test.maxScore, 0);

    return {
      score: totalScore,
      maxScore: totalMaxScore,
      percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
      tests: domainTests
    };
  };

  const getScoreStatus = (percentage: number) => {
    if (isNaN(percentage)) return { status: "無資料", color: "bg-muted text-muted-foreground" }; // Handle NaN
    if (percentage >= 80) return { status: "優秀", color: "bg-success text-white" };
    if (percentage >= 60) return { status: "正常", color: "bg-warning text-white" };
    return { status: "需關注", color: "bg-destructive text-white" };
  };

  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-5 w-5" />
          認知功能分域評估
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* --- 3. 更新 Grid 佈局 --- */}
        {/* 將 xl:grid-cols-5 改為 xl:grid-cols-6 以容納六個卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* --- 修改結束 --- */}
          {cognitiveDomains.map((domain, index) => {
            const domainScore = getDomainScore(domain);
            // 處理分數可能是 NaN 的情況 (如果 maxScore 為 0)
            const percentage = isNaN(domainScore.percentage) ? 0 : domainScore.percentage;
            const status = getScoreStatus(percentage);
            const IconComponent = domain.icon;

            // 如果該分域完全沒有對應的測驗分數 (例如: scores 陣列為空)，可以選擇不渲染
            // (Keep this logic or adjust as needed)
             if (domainScore.maxScore === 0 && domainScore.tests.length > 0 && scores.length > 0) {
               // Render a placeholder or return null
               return (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30 border-muted/50 flex flex-col items-center justify-center">
                     <IconComponent className="h-4 w-4 text-muted-foreground mb-2" />
                     <h3 className="font-semibold text-sm text-muted-foreground mb-1">{domain.name}</h3>
                     <p className="text-xs text-muted-foreground/70">無資料</p>
                  </div>
               );
             }


            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${domain.bgColor} border-current/20 transition-all hover:shadow-md flex flex-col`} // 加入 flex flex-col
              >
                {/* (domain header 保持不變) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${domain.color}`} />
                    <h3 className="font-semibold text-sm text-foreground">{domain.name}</h3>
                  </div>
                   {/* 只有在有分數時才顯示 Badge */}
                   {domainScore.maxScore > 0 && (
                      <Badge className={status.color} variant="secondary">
                        {status.status}
                      </Badge>
                   )}
                </div>

                {/* (domain score/progress) */}
                <div className="space-y-2 mb-3"> {/* 加入 mb-3 */}
                 {/* 只有在有分數時才顯示分數和進度條 */}
                 {domainScore.maxScore > 0 ? (
                   <>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground">
                        {domainScore.score}/{domainScore.maxScore}
                      </span>
                      <span className={`text-sm font-medium ${domain.color}`}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      // Optional: Add indicator color based on domain
                      // indicatorClassName={domain.color.replace('text-', 'bg-')}
                    />
                   </>
                  ) : (
                     <p className="text-xs text-muted-foreground text-center py-2">無此項目分數</p>
                  )}
                </div>

                {/* (Dialog 區塊) */}
                {/* 使用 flex-grow 讓 Dialog 列表填滿剩餘空間 */}
                <div className="mt-auto space-y-1 flex-grow">
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
                              {/* 處理分數可能不存在的情況 */}
                              {test.score ?? 'N/A'}/{test.maxScore}
                            </span>
                            <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>
                      {/* (DialogContent 保持不變) */}
                       <DialogContent className="max-w-3xl max-h-[90vh] p-0">
                         <DialogHeader className="p-6 pb-0">
                           <DialogTitle className="text-2xl">{test.test}</DialogTitle>
                         </DialogHeader>
                         <ScrollArea className="max-h-[calc(90vh-100px)] px-6">
                           <div className="space-y-6 pb-6">
                             {/* (分數顯示) */}
                             <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                                <div className="text-center">
                                  <div className="text-4xl font-bold text-primary">
                                    {test.score ?? '-'} {/* Handle undefined score */}
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
                                    value={test.maxScore > 0 ? ((test.score ?? 0) / test.maxScore) * 100 : 0}
                                    className="h-4"
                                  />
                                  <div className="text-right mt-2 text-sm font-medium text-primary">
                                    {test.maxScore > 0 ? Math.round(((test.score ?? 0) / test.maxScore) * 100) : 0}%
                                  </div>
                                </div>
                             </div>
                             {/* (描述) */}
                             {test.description && (
                                <div className="p-4 bg-accent/10 rounded-lg">
                                  <h4 className="font-semibold mb-2 text-foreground">測驗表現</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{test.description}</p>
                                </div>
                              )}
                             {/* (圖片) */}
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
                             {/* (音檔) */}
                             {test.audioUrls && test.audioUrls.length > 0 && (
                               <div>
                                 <h4 className="font-semibold mb-3 text-foreground">
                                   測驗錄音 {test.audioUrls.length > 1 ? `(共 ${test.audioUrls.length} 筆)` : ''}
                                 </h4>
                                 <div className="space-y-3">
                                   {test.audioUrls.map((url, index) => (
                                     <div key={index}>
                                       {test.audioUrls.length > 1 && (
                                          <label className="text-sm text-muted-foreground mb-1 block">
                                            {url.split('%2F').pop()?.split('?')[0].replace('減法運算_', '').replace('.wavData', '') || `錄音 ${index + 1}`}
                                          </label>
                                       )}
                                       <audio controls className="w-full" preload="metadata">
                                         <source src={url} type="audio/mpeg" />
                                         您的瀏覽器不支援音訊播放
                                       </audio>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         </ScrollArea>
                       </DialogContent>
                    </Dialog>
                  ))}
                   {/* 如果該領域沒有任何測驗項目 */}
                   {domainScore.tests.length === 0 && domainScore.maxScore > 0 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">此領域無詳細項目</p>
                   )}
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