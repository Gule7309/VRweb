import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// 移除 Badge, TrendingUp, Bot
import { Move } from "lucide-react";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { useMemo } from "react";

const TRIM_FIRST = 120; // 去掉前120筆

export interface HandDataPoint {
  type: "RightHand" | "LeftHand";
  x: number;
  y: number;
  z: number;
  time: number;
  triggerPressed: number;
}

interface PlotPoint {
  x: number;
  y: number;
}

// 移除 HandMetrics 介面

// 移除 metrics prop
interface HandMovementVisualizationProps {
  handData: HandDataPoint[];
}

// 移除 getSpeedStatus 輔助函式

// 移除 metrics prop
export const HandMovementVisualization = ({ handData }: HandMovementVisualizationProps) => {
  
  // 移除 speedStatus 的計算

  // (useMemo 處理資料的邏輯保持不變)
  const processedData = useMemo(() => {
    if (!handData || handData.length <= TRIM_FIRST) {
      return { right: [], left: [], trigger: [] };
    }
    const trimmedData = handData.slice(TRIM_FIRST);
    const rightOrigin = trimmedData.find(d => d.type === "RightHand");
    const leftOrigin = trimmedData.find(d => d.type === "LeftHand");
    const rightPath: PlotPoint[] = [];
    const leftPath: PlotPoint[] = [];
    const triggerPoints: PlotPoint[] = [];

    trimmedData.forEach(point => {
      let origin = null;
      let targetArray = null;

      if (point.type === "RightHand") {
        origin = rightOrigin;
        targetArray = rightPath;
      } else if (point.type === "LeftHand") {
        origin = leftOrigin;
        targetArray = leftPath;
      }

      if (origin && targetArray) {
        const plotPoint = {
          x: point.x - origin.x,
          y: point.y - origin.y
        };
        targetArray.push(plotPoint);
        if (point.triggerPressed === 1 || point.triggerPressed > 0) {
          triggerPoints.push(plotPoint);
        }
      }
    });
    return { right: rightPath, left: leftPath, trigger: triggerPoints };
  }, [handData]);

  return (
    <Card className="shadow-medical border-0 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Move className="h-5 w-5" />
          手部控制器 3D 移動分析
        </CardTitle>
      </CardHeader>
      {/* 移除 CardContent 的 space-y-4 */}
      <CardContent>
        
        {/* 1. 2D 散點圖 */}
        {/* --- 變更: 增加圖表高度 --- */}
        <div 
          className="w-full h-[400px] border rounded-lg p-4 bg-gray-50/50" 
          aria-label="手部移動軌跡 2D 散點圖"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X軸" 
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "X軸", position: 'insideBottom', offset: -10, fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y軸" 
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "Y軸", position: 'insideLeft', angle: -90, offset: -5, fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  padding: "8px"
                }}
                itemStyle={{ padding: 0 }}
              />
              <Legend 
                iconType="circle"
                verticalAlign="top"
                align="left"
                wrapperStyle={{ fontSize: "12px", paddingBottom: "10px", marginLeft: "20px" }}
              />
              <Scatter 
                name="RightHand" 
                data={processedData.right} 
                fill="#F87171" 
                shape="circle" 
                r={2}
              />
              <Scatter 
                name="LeftHand" 
                data={processedData.left} 
                fill="#60A5FA" 
                shape="circle" 
                r={2}
              />
              <Scatter 
                name="Trigger Press"
                data={processedData.trigger}
                fill="#FACC15" 
                shape="star" 
                r={8}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* --- 變更: 移除底部的資訊卡 --- */}
        
      </CardContent>
    </Card>
  );
};