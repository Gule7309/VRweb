import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Move3D, TrendingUp, Zap, RotateCcw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// --- 1. 定義 Props 介面 ---
interface HandMovementProps {
  trajectoryUrl: string | null; // 接收來自 Index.tsx 的 URL
}

// --- 2. 預設的模擬資料 ---
const SIMULATED_DATA = {
  avgVelocity: 0.85, // m/s
  tremor: 0.12, // 震顫指數 (這將被真實資料覆蓋)
  precision: 0.78, // 精確度
  stability: 0.69, // 穩定性
  pathEfficiency: 0.73, // 路徑效率
};

// --- 3. Worker 回傳的資料型別 ---
interface TremorMetrics {
  peakFrequency: number;
  tremorAmplitude: number; // 單位: cm
  rmsAcceleration: number;
  tremorPower: number;
}

export const HandMovementVisualization = ({ trajectoryUrl }: HandMovementProps) => {
  // --- 4. 元件狀態 ---
  const [movementData, setMovementData] = useState(SIMULATED_DATA);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // (動畫狀態保持不變)
  const [animationPhase, setAnimationPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 5. 核心 Web Worker 邏輯 ---
  useEffect(() => {
    // 如果沒有 URL (例如: 最新的測驗不是 level_1)，就重設為預設值
    if (!trajectoryUrl) {
      setMovementData(SIMULATED_DATA);
      setStatus('idle');
      return;
    }

    if (!window.Worker) {
      console.error("Web Workers are not supported in this browser.");
      setStatus('error');
      setError('Web Workers not supported.');
      return;
    }

    setStatus('loading');
    setError(null);
    
    // 確保 worker 路徑是從 public 資料夾的根目錄開始
    const worker = new Worker('/analysis.worker.js');
    let dataFetched = false;

    // 5a. 監聽 Worker 傳回的訊息
    worker.onmessage = (event) => {
      dataFetched = true;
      const { status: workerStatus, data, message } = event.data;
      
      if (workerStatus === 'success') {
        const metrics: TremorMetrics = data;
        
        // --- 關鍵: 用真實資料覆蓋模擬資料 ---
        setMovementData(prevData => ({
          ...prevData,
          // 您的 worker 計算出 tremorAmplitude (cm)
          // 模擬資料 tremor: 0.12 也是一個小數
          // 我們直接替換它
          tremor: metrics.tremorAmplitude, 
        }));
        setStatus('success');
      } else {
        // Worker 內部運算出錯
        setStatus('error');
        setError(message);
      }
      worker.terminate();
    };

    // 5b. 監聽 Worker 本身的錯誤
    worker.onerror = (err) => {
      dataFetched = true;
      console.error("Web Worker error:", err);
      setStatus('error');
      setError(err.message);
      worker.terminate();
    };

    // 5c. 下載 CSV 檔案並傳送給 Worker
    fetch(trajectoryUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        return response.text();
      })
      .then(csvText => {
        // (根據您的 worker 檔案，硬編碼手部和取樣率)
        worker.postMessage({
          csvData: csvText,
          handType: 'RightHand', // 假設
          targetSampleRate: 65     // 假設
        });
      })
      .catch(fetchError => {
        dataFetched = true;
        console.error("Fetch error:", fetchError);
        setStatus('error');
        setError(fetchError.message);
        worker.terminate();
      });
      
    // 10 秒超時處理
    setTimeout(() => {
        if (!dataFetched) {
            worker.terminate();
            setStatus('error');
            setError('Analysis worker timed out.');
        }
    }, 10000); 

    // 清理函式
    return () => {
      worker.terminate();
    }

  }, [trajectoryUrl]); // 當 trajectoryUrl 改變時，重新執行

  // (輔助函式保持不變)
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

  // --- 6. JSX 渲染 (已加入載入中/錯誤狀態) ---
  return (
    <Card className="shadow-medical border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Move3D className="h-5 w-5" />
          手部控制器 3D 移動分析
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
                <span className={`font-bold ${getMetricColor(movementData.avgVelocity)}`}>
                  {movementData.avgVelocity} m/s
                </span>
                <Badge className={getMetricBadge(movementData.avgVelocity).color}>
                  {getMetricBadge(movementData.avgVelocity).label}
                </Badge>
              </div>
            </div>

            {/* 震顫指數 - 現在是真實資料 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="text-sm font-medium">震顫指數</span>
              </div>
              
              {/* --- 變更: 根據狀態顯示不同內容 --- */}
              <div className="flex items-center gap-2">
                {status === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {status === 'error' && (
                  <Badge className="bg-destructive text-white">錯誤</Badge>
                )}
                {(status === 'success' || status === 'idle') && (
                  <>
                    <span className={`font-bold ${getMetricColor(1 - movementData.tremor)}`}>
                      {/* 將 cm 單位四捨五入到小數點後兩位 */}
                      {movementData.tremor.toFixed(2)} cm 
                    </span>
                    <Badge className={getMetricBadge(1 - movementData.tremor).color}>
                      {getMetricBadge(1 - movementData.tremor).label}
                    </Badge>
                  </>
                )}
              </div>
              {/* --- 變更結束 --- */}

            </div>

            {/* (穩定性 - 仍是模擬資料) */}
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
            {/* (AI 分析建議 - 仍是靜態文字) */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">AI 分析建議</h4>
              {/* 顯示錯誤訊息 */}
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