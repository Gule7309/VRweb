import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Move3D, TrendingUp, Zap, RotateCcw, Loader2, Target, Route } from "lucide-react"; // <-- Added Target, Route
import { useEffect, useState } from "react";

// --- 1. 定義 Props 介面 (不變) ---
interface HandMovementProps {
  trajectoryUrl: string | null; // 接收來自 Index.tsx 的 URL
}

// --- 2. 預設的模擬資料 (加入了穩定性欄位) ---
const SIMULATED_DATA = {
  avgVelocity: 0.85, // m/s (仍是模擬)
  tremor: 0.12,      // cm (將被真實資料覆蓋)
  stability: 0.05,   // m (端點SD, 將被真實資料覆蓋)
  pathSmoothness: 0.73, // (路徑RMSD的反向指標, 將被覆蓋)
  // 移除了 precision, pathEfficiency
};

// --- 3. Worker 回傳的資料型別 (擴充) ---
interface AnalysisMetrics {
  // Tremor
  peakFrequency: number;
  tremorAmplitude: number; // 單位: cm
  tremorPower: number;
  // Stability (Reaching Task)
  endpointSD?: number;     // 單位: m
  pathRMSD?: number;       // 單位: m
  timeCV?: number;         // 單位: %
  // Stability (Tapping Task)
  tappingCV?: number;      // 單位: %
  meanITI?: number;        // 單位: s
  sdITI?: number;          // 單位: s
  // Common
  trialCount?: number;
}

export const HandMovementVisualization = ({ trajectoryUrl }: HandMovementProps) => {
  // --- 4. 元件狀態 (movementData 結構改變) ---
  const [movementData, setMovementData] = useState(SIMULATED_DATA);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [trialCount, setTrialCount] = useState<number | null>(null);

  // (動畫狀態保持不變)
  const [animationPhase, setAnimationPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 5. 核心 Web Worker 邏輯 (修改) ---
  useEffect(() => {
    if (!trajectoryUrl) {
      setMovementData(SIMULATED_DATA); // 重設為預設值
      setStatus('idle');
      setTrialCount(null);
      return;
    }

    if (!window.Worker) { /* ... (Worker 支援檢查) ... */ return; }

    setStatus('loading');
    setError(null);
    setTrialCount(null);
    
    const worker = new Worker('/analysis.worker.js');
    let dataFetched = false;

    // 5a. 監聽 Worker 傳回的訊息 (修改)
    worker.onmessage = (event) => {
      dataFetched = true;
      const { status: workerStatus, data, message } = event.data;
      
      if (workerStatus === 'success') {
        const metrics: AnalysisMetrics = data;
        
        // --- 關鍵: 用真實資料覆蓋模擬資料 ---
        setMovementData(prevData => ({
          ...prevData,
          tremor: metrics.tremorAmplitude, // 來自 worker (cm)
          // 使用 Endpoint SD (m) 作為 Stability 指標
          stability: metrics.endpointSD ?? prevData.stability, 
          // 使用 Path RMSD (m) 的倒數 (簡化) 作為 Path Smoothness
          // (RMSD 越小越好，所以 1/RMSD 越大越好)
          pathSmoothness: metrics.pathRMSD ? (1 / (1 + metrics.pathRMSD * 10)) : prevData.pathSmoothness, // 簡易轉換
        }));
        setTrialCount(metrics.trialCount ?? null);
        setStatus('success');
      } else {
        setStatus('error');
        setError(message);
      }
      worker.terminate();
    };

    worker.onerror = (err) => { /* ... (錯誤處理) ... */ };

    // 5c. 下載 CSV 並傳送給 Worker (修改: 加入 taskType)
    fetch(trajectoryUrl)
      .then(response => response.text())
      .then(csvText => {
        worker.postMessage({
          csvData: csvText,
          handType: 'RightHand', // 假設
          targetSampleRate: 65,    // 假設
          taskType: 'reaching'     // <-- 新增：指定任務類型
        });
      })
      .catch(fetchError => { /* ... (錯誤處理) ... */ });
      
    // (超時處理 & 清理函式 不變)
    // ...
    return () => { worker.terminate(); }

  }, [trajectoryUrl]);

  // --- 6. 輔助函式 (修改 stability 的閾值) ---
  const getMetricColor = (value: number, type: 'velocity' | 'tremor' | 'stability' | 'smoothness') => {
    if (type === 'tremor') { // 震顫越小越好
      if (value <= 0.5) return "text-success"; // < 0.5 cm
      if (value <= 1.5) return "text-warning"; // 0.5 - 1.5 cm
      return "text-destructive"; // > 1.5 cm
    }
    if (type === 'stability') { // 端點 SD 越小越好 (單位: m)
      if (value <= 0.02) return "text-success"; // < 2 cm
      if (value <= 0.05) return "text-warning"; // 2 - 5 cm
      return "text-destructive"; // > 5 cm
    }
    // 其他 (越大越好)
    if (value >= 0.8) return "text-success";
    if (value >= 0.6) return "text-warning";
    return "text-destructive";
  };
  const getMetricBadge = (value: number, type: 'velocity' | 'tremor' | 'stability' | 'smoothness') => {
     if (type === 'tremor') { // 震顫越小越好
      if (value <= 0.5) return { label: "輕微", color: "bg-success text-white" };
      if (value <= 1.5) return { label: "中度", color: "bg-warning text-white" };
      return { label: "明顯", color: "bg-destructive text-white" };
    }
     if (type === 'stability') { // 端點 SD 越小越好
      if (value <= 0.02) return { label: "穩定", color: "bg-success text-white" };
      if (value <= 0.05) return { label: "尚可", color: "bg-warning text-white" };
      return { label: "不穩", color: "bg-destructive text-white" };
    }
    // 其他 (越大越好)
    if (value >= 0.8) return { label: "優秀", color: "bg-success text-white" };
    if (value >= 0.6) return { label: "正常", color: "bg-warning text-white" };
    return { label: "需改善", color: "bg-destructive text-white" };
  };

  // --- 7. JSX 渲染 (更新指標名稱和單位) ---
  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Move3D className="h-5 w-5" />
          手部控制器 3D 移動分析
          {trialCount !== null && (
            <Badge variant="outline" className="text-xs">
              {trialCount} 次試驗
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* (3D軌跡可視化區域 保持不變) */}
        <div className="relative h-48 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 overflow-hidden">
          {/* ... (SVG 和動畫) ... */}
        </div>

        {/* 移動指標 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* (平均速度 - 仍是模擬資料) */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                <span className="text-sm font-medium">平均速度</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getMetricColor(movementData.avgVelocity, 'velocity')}`}>
                  {movementData.avgVelocity.toFixed(2)} m/s
                </span>
                <Badge className={getMetricBadge(movementData.avgVelocity, 'velocity').color}>
                  {getMetricBadge(movementData.avgVelocity, 'velocity').label}
                </Badge>
              </div>
            </div>

            {/* 震顫指數 - 真實資料 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="text-sm font-medium">震顫幅度</span>
              </div>
              <div className="flex items-center gap-2">
                {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {status === 'error' && <Badge className="bg-destructive text-white">錯誤</Badge>}
                {(status === 'success' || status === 'idle') && (
                  <>
                    <span className={`font-bold ${getMetricColor(movementData.tremor, 'tremor')}`}>
                      {movementData.tremor.toFixed(2)} cm
                    </span>
                    <Badge className={getMetricBadge(movementData.tremor, 'tremor').color}>
                      {getMetricBadge(movementData.tremor, 'tremor').label}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* 穩定性 (Endpoint SD) - 真實資料 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-chart-4" /> {/* 改圖示 */}
                <span className="text-sm font-medium">終點穩定性</span>
              </div>
              <div className="flex items-center gap-2">
                 {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                 {status === 'error' && <Badge className="bg-destructive text-white">錯誤</Badge>}
                 {(status === 'success' || status === 'idle') && (
                  <>
                    <span className={`font-bold ${getMetricColor(movementData.stability, 'stability')}`}>
                      {(movementData.stability * 100).toFixed(1)} cm {/* 顯示 cm */}
                    </span>
                    <Badge className={getMetricBadge(movementData.stability, 'stability').color}>
                      {getMetricBadge(movementData.stability, 'stability').label}
                    </Badge>
                  </>
                 )}
              </div>
            </div>

            {/* 路徑平滑度 (Path RMSD 的反向) - 真實資料 */}
             <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-chart-5" /> {/* 改圖示 */}
                <span className="text-sm font-medium">路徑平滑度</span>
              </div>
              <div className="flex items-center gap-2">
                 {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                 {status === 'error' && <Badge className="bg-destructive text-white">錯誤</Badge>}
                 {(status === 'success' || status === 'idle') && (
                  <>
                    <span className={`font-bold ${getMetricColor(movementData.pathSmoothness, 'smoothness')}`}>
                      {(movementData.pathSmoothness * 100).toFixed(0)}% {/* 顯示百分比 */}
                    </span>
                    <Badge className={getMetricBadge(movementData.pathSmoothness, 'smoothness').color}>
                      {getMetricBadge(movementData.pathSmoothness, 'smoothness').label}
                    </Badge>
                  </>
                 )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* (AI 分析建議 - 仍是靜態文字) */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">AI 分析建議</h4>
              {status === 'error' && error && (
                <p className="text-xs text-destructive mb-2">{error}</p>
              )}
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