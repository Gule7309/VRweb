import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Move3D, TrendingUp, Zap, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export const HandMovementVisualization = () => {
  const [animationPhase, setAnimationPhase] = useState(0);

  // 模擬3D移動數據
  const movementData = {
    avgVelocity: 0.85, // m/s
    tremor: 0.12, // 震顫指數
    precision: 0.78, // 精確度
    stability: 0.69, // 穩定性
    pathEfficiency: 0.73, // 路徑效率
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (value: number) => {
    if (value >= 0.8) return "text-success";
    if (value >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getMetricBadge = (value: number) => {
    if (value >= 0.8) return { label: "優秀", color: "bg-success text-white" };
    if (value >= 0.6) return { label: "正常", color: "bg-warning text-white" };
    return { label: "需改善", color: "bg-destructive text-white" };
  };

  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Move3D className="h-5 w-5" />
          手部控制器 3D 移動分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 3D軌跡可視化區域 */}
        <div className="relative h-48 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 模擬3D軌跡 */}
            <div className="relative w-32 h-32">
              {/* 中心點 */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
              
              {/* 軌跡路徑 */}
              <svg className="w-full h-full" viewBox="0 0 128 128">
                <path
                  d="M20,64 Q32,20 64,32 T108,64 Q96,108 64,96 T20,64"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  opacity="0.6"
                  className={`transition-all duration-1000 ${animationPhase % 2 === 0 ? 'opacity-60' : 'opacity-30'}`}
                />
                <path
                  d="M32,32 Q64,16 96,32 Q112,64 96,96 Q64,112 32,96 Q16,64 32,32"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.5"
                  strokeDasharray="2,3"
                  opacity="0.4"
                  className={`transition-all duration-1000 ${animationPhase % 2 === 1 ? 'opacity-40' : 'opacity-20'}`}
                />
              </svg>
              
              {/* 移動點 */}
              <div 
                className={`absolute w-3 h-3 bg-accent rounded-full transition-all duration-1000 ${
                  animationPhase === 0 ? 'top-8 left-8' :
                  animationPhase === 1 ? 'top-8 right-8' :
                  animationPhase === 2 ? 'bottom-8 right-8' : 'bottom-8 left-8'
                }`}
                style={{ transform: 'translate(-50%, -50%)' }}
              ></div>
            </div>
          </div>
          
          {/* 座標軸標示 */}
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-chart-1"></div>
              <span>X軸</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-0.5 h-3 bg-chart-2"></div>
              <span>Y軸</span>
            </div>
          </div>
        </div>

        {/* 移動指標 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                <span className="text-sm font-medium">平均速度</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getMetricColor(movementData.avgVelocity)}`}>
                  {movementData.avgVelocity} m/s
                </span>
                <Badge className={getMetricBadge(movementData.avgVelocity).color}>
                  {getMetricBadge(movementData.avgVelocity).label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="text-sm font-medium">震顫指數</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getMetricColor(1 - movementData.tremor)}`}>
                  {movementData.tremor}
                </span>
                <Badge className={getMetricBadge(1 - movementData.tremor).color}>
                  {getMetricBadge(1 - movementData.tremor).label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-medium">穩定性</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getMetricColor(movementData.stability)}`}>
                  {(movementData.stability * 100).toFixed(0)}%
                </span>
                <Badge className={getMetricBadge(movementData.stability).color}>
                  {getMetricBadge(movementData.stability).label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">AI 分析建議</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 手部震顫程度輕微，在正常範圍內</p>
                <p>• 移動軌跡顯示中度精細動作障礙</p>
                <p>• 建議加強手部精細動作訓練</p>
                <p>• 持續追蹤移動模式變化</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};