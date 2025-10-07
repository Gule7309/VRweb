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
    { 
      test: "定向力(時間)", 
      score: 4, 
      maxScore: 5,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      imageUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400",
      description: "患者能正確回答大部分時間相關問題，僅在具體日期上略有遲疑"
    },
    { 
      test: "定向力(地點)", 
      score: 5, 
      maxScore: 5,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
      description: "患者能完全正確識別所在地點及其周邊環境"
    },
    { 
      test: "即時記憶", 
      score: 3, 
      maxScore: 3,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
      description: "短期記憶表現良好，能立即復述所有項目"
    },
    { 
      test: "注意力與計算", 
      score: 3, 
      maxScore: 5,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      imageUrl: "https://images.unsplash.com/photo-1554224311-beee460c201a?w=400",
      description: "計算能力中等，在連續計算時出現輕微錯誤"
    },
    { 
      test: "延遲記憶", 
      score: 2, 
      maxScore: 3,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400",
      description: "延遲記憶稍弱，部分項目需要提示才能回憶"
    },
    { 
      test: "命名", 
      score: 2, 
      maxScore: 2,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400",
      description: "物品命名能力正常，反應迅速"
    },
    { 
      test: "複述", 
      score: 1, 
      maxScore: 1,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      imageUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400",
      description: "語句複述準確無誤"
    },
    { 
      test: "三步驟指令", 
      score: 2, 
      maxScore: 3,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      description: "能執行多數指令，但在第三步驟時略顯困難"
    },
    { 
      test: "閱讀", 
      score: 1, 
      maxScore: 1,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
      description: "閱讀理解能力良好"
    },
    { 
      test: "書寫", 
      score: 1, 
      maxScore: 1,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400",
      description: "書寫表達清晰完整"
    },
    { 
      test: "視覺建構", 
      score: 2, 
      maxScore: 1,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
      description: "視覺空間能力優異，圖形繪製準確"
    },
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