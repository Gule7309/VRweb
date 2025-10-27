import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// --- 變更: 匯入圖示、useState, useEffect, useMemo ---
import { Move, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
// --- 變更結束 ---
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

// === 動畫設定 ===
const TRIM_FIRST = 120;         // 去掉前120筆
const PLAYBACK_SPEED_MS = 50;   // 播放速度 (毫秒)，越小越快
const FRAMES_PER_TICK = 10;     // 每次更新時前進的影格數 (避免太慢)

// (介面定義保持不變)
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
interface HandMovementVisualizationProps {
  handData: HandDataPoint[];
}

// (props 保持不變)
export const HandMovementVisualization = ({ handData }: HandMovementVisualizationProps) => {

  // --- 變更: 動畫狀態 ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  // --- 變更結束 ---


  // --- 變更: Memo 1 - 準備所有動畫影格 (只執行一次) ---
  const animationFrames = useMemo(() => {
    if (!handData || handData.length <= TRIM_FIRST) {
      return { trimmedData: [], rightOrigin: null, leftOrigin: null, totalFrames: 0 };
    }

    const trimmedData = handData.slice(TRIM_FIRST);
    const rightOrigin = trimmedData.find(d => d.type === "RightHand");
    const leftOrigin = trimmedData.find(d => d.type === "LeftHand");
    const totalFrames = trimmedData.length;
    
    return { trimmedData, rightOrigin, leftOrigin, totalFrames };
  }, [handData]);

  const { totalFrames } = animationFrames;

  // --- 變更: Memo 2 - 根據 "目前影格" 計算要顯示的資料 ---
  // (這就是您 Python 中的 update(frame) 函式)
  const currentFrameData = useMemo(() => {
    const { trimmedData, rightOrigin, leftOrigin } = animationFrames;
    
    // 取得目前影格的資料
    const dataSlice = trimmedData.slice(0, currentFrame);

    const rightPath: PlotPoint[] = [];
    const leftPath: PlotPoint[] = [];
    const triggerPoints: PlotPoint[] = [];

    dataSlice.forEach(point => {
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

  }, [animationFrames, currentFrame]); // 依賴 "目前影格"
  // --- 變更結束 ---


  // --- 變更: 動畫計時器 ---
  useEffect(() => {
    if (!isPlaying) {
      return; // 如果暫停，就什麼都不做
    }
    
    // 如果播放中，且尚未到底
    if (isPlaying && currentFrame < totalFrames) {
      const timer = setInterval(() => {
        setCurrentFrame(prevFrame => {
          const nextFrame = Math.min(prevFrame + FRAMES_PER_TICK, totalFrames);
          if (nextFrame === totalFrames) {
            setIsPlaying(false); // 播放到底，自動暫停
          }
          return nextFrame;
        });
      }, PLAYBACK_SPEED_MS);
      
      // 清除計時器
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentFrame, totalFrames]); // 依賴這些狀態
  
  // --- 變更: 控制器函式 ---
  const handlePlayPause = () => {
    if (currentFrame >= totalFrames) {
      // 如果到底了，按播放 = 重播
      setCurrentFrame(0);
      setIsPlaying(true);
    } else {
      // 否則，切換播放/暫停
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };
  
  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false); // 拖動時自動暫停
    setCurrentFrame(value[0]);
  };
  // --- 變更結束 ---


  return (
    <Card className="shadow-medical border-0 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Move className="h-5 w-5" />
          手部控制器 3D 移動分析
        </CardTitle>
      </CardHeader>
      {/* --- 變更: 調整 CardContent 結構 --- */}
      <CardContent className="flex flex-col h-[calc(100%-80px)]"> 
        {/* 1. 2D 散點圖 (增加 flex-1 讓它填滿空間) */}
        <div 
          className="w-full flex-1 h-[300px] border rounded-lg p-4 bg-gray-50/50" // h-[300px] 只是個最小高度
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
                domain={[-0.3, 0.3]} // 鎖定範圍 (同 Python 邏輯)
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "X軸", position: 'insideBottom', offset: -10, fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y軸" 
                domain={[-0.3, 0.3]} // 鎖定範圍 (同 Python 邏輯)
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

              {/* --- 變更: data 來自 currentFrameData --- */}
              <Scatter 
                name="RightHand" 
                data={currentFrameData.right} 
                fill="#F87171" 
                shape="circle" 
                r={2}
              />
              <Scatter 
                name="LeftHand" 
                data={currentFrameData.left} 
                fill="#60A5FA" 
                shape="circle" 
                r={2}
              />
              <Scatter 
                name="Trigger Press"
                data={currentFrameData.trigger}
                fill="#FACC15" 
                shape="star" 
                r={8}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* --- 變更: 新增動畫控制器 --- */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <Button variant="ghost" size="icon" onClick={handlePlayPause}>
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Slider
            value={[currentFrame]}
            max={totalFrames}
            step={1}
            onValueChange={handleSliderChange}
            className="flex-1"
            disabled={totalFrames === 0}
          />
          <div className="text-sm text-muted-foreground w-24 text-right">
            {currentFrame} / {totalFrames}
          </div>
        </div>
        {/* --- 變更結束 --- */}
        
      </CardContent>
    </Card>
  );
};