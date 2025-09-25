import { PatientInfoCard } from "@/components/PatientInfoCard";
import { MMSERadarChart } from "@/components/MMSERadarChart";
import { HandMovementVisualization } from "@/components/HandMovementVisualization";
import { CognitiveScoreCards } from "@/components/CognitiveScoreCards";
import { RiskAssessment } from "@/components/RiskAssessment";
import { TrendChart } from "@/components/TrendChart";

const Index = () => {
  // 模擬患者數據
  const patientData = {
    name: "李小明",
    age: 68,
    gender: "男性",
    testDate: "2024-01-15",
    testDuration: "32分鐘",
    vrDevice: "Meta Quest 3",
    totalScore: 26,
    maxScore: 30,
  };

  const mmseResults = [
    { test: "定向力(時間)", score: 4, maxScore: 5 },
    { test: "定向力(地點)", score: 5, maxScore: 5 },
    { test: "即時記憶", score: 3, maxScore: 3 },
    { test: "注意力與計算", score: 3, maxScore: 5 },
    { test: "延遲記憶", score: 2, maxScore: 3 },
    { test: "命名", score: 2, maxScore: 2 },
    { test: "複述", score: 1, maxScore: 1 },
    { test: "三步驟指令", score: 2, maxScore: 3 },
    { test: "閱讀", score: 1, maxScore: 1 },
    { test: "書寫", score: 1, maxScore: 1 },
    { test: "視覺建構", score: 2, maxScore: 1 },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            MMSE VR 測驗結果分析系統
          </h1>
          <p className="text-muted-foreground">
            基於虛擬實境技術的迷你心智狀態檢查結果與認知功能評估
          </p>
        </div>

        {/* Patient Info */}
        <PatientInfoCard patient={patientData} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MMSE Radar Chart */}
          <div className="lg:col-span-1">
            <MMSERadarChart data={mmseResults} />
          </div>

          {/* Hand Movement Visualization */}
          <div className="lg:col-span-1">
            <HandMovementVisualization />
          </div>
        </div>

        {/* Cognitive Score Cards */}
        <CognitiveScoreCards scores={mmseResults} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Assessment */}
          <RiskAssessment totalScore={patientData.totalScore} />

          {/* Trend Chart */}
          <TrendChart />
        </div>
      </div>
    </div>
  );
};

export default Index;