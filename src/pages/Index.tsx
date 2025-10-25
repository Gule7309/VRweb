import { useState, useEffect } from "react";
// 匯入所有需要的 Firestore 函式
import { db } from "@/firebase";
// (已移除 limit)
import { doc, getDoc, collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";

// 匯入您的所有元件
import { PatientInfoCard } from "@/components/PatientInfoCard";
import { MMSERadarChart } from "@/components/MMSERadarChart";
import { HandMovementVisualization } from "@/components/HandMovementVisualization";
import { CognitiveScoreCards } from "@/components/CognitiveScoreCards";
import { RiskAssessment } from "@/components/RiskAssessment";
import { TrendChart } from "@/components/TrendChart";

// 您的預設假資料 (作為基底)
const defaultPatientData = {
  name: "李小明",
  age: 68,
  gender: "男性",
  testDate: "2024-01-15",
  testDuration: "32分鐘",
  vrDevice: "Meta Quest 2",
  totalScore: 26,
  maxScore: 30,
};

// 您的 MMSE 項目陣列 (已將 audioUrl 改為 audioUrls)
const defaultMmseResults = [
  // 索引 0
  { test: "定向力(時間)", score: 3, maxScore: 5, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 1
  { test: "定向力(地點)", score: 5, maxScore: 5, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 2
  { test: "短期記憶", score: 3, maxScore: 3, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 3
  { test: "注意力", score: 3, maxScore: 5, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 4
  { test: "近期記憶", score: 2, maxScore: 3, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 5
  { test: "命名", score: 2, maxScore: 2, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 6
  { test: "重複語句", score: 1, maxScore: 1, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 7
  { test: "理解指令", score: 2, maxScore: 3, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 8
  { test: "理解文字", score: 1, maxScore: 1, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 9
  { test: "語句完整度", score: 1, maxScore: 1, audioUrls: [], imageUrl: "...", description: "..." },
  // 索引 10
  { test: "畫圖", score: 1, maxScore: 1, audioUrls: [], imageUrl: "...", description: "..." },
];

// 您的 levelId 對應表
const levelIdToMmseIndex: { [key: string]: number } = {
  'level_2': 0, 'level_9': 1, 'level_8_Round1': 2, 'level_7': 3,
  'level_8_Round2': 4, 'level_5': 5, 'level_6': 6, 'level_4': 7,
  'level_10': 8, 'level_3': 9, 'level_1': 10,
};

// --- 變更: 複製 CognitiveScoreCards 的分域設定，用於計算歷史資料 ---
const cognitiveDomains = [
  { name: "定向力", tests: ["定向力(時間)", "定向力(地點)"] },
  { name: "記憶力", tests: ["短期記憶", "近期記憶"] },
  { name: "注意力", tests: ["注意力"] },
  { name: "語言能力", tests: ["命名", "重複語句", "理解指令", "理解文字", "語句完整度"] },
  { name: "視覺空間", tests: ["畫圖"] }
];

// --- 變更: 匯出 HistoricalTrendData 型別 ---
export interface HistoricalTrendData {
  score: number;
  date: Date;
}

// --- 變更: 匯出 TrendChartDataPoint 型別 ---
export interface TrendChartDataPoint {
  month: string;
  總分: number;
  定向力: number;
  記憶力: number;
  注意力: number;
  語言能力: number;
  視覺空間: number;
}

// 幫手函式：將 Date 物件格式化為 "X個月前" 或 "本日"
const formatTrendDate = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "本日";
  if (diffDays < 30) return `${diffDays}天前`;
  const diffMonths = Math.round(diffDays / 30.44);
  if (diffMonths <= 0) return "本月";
  if (diffMonths <= 12) return `${diffMonths}個月前`;
  const diffYears = Math.round(diffDays / 365.25);
  return `${diffYears}年前`;
};


const Index = () => {
  // State for latest data
  const [patientData, setPatientData] = useState(defaultPatientData);
  const [mmseResults, setMmseResults] = useState(defaultMmseResults);
  
  // --- 變更: 建立 "所有" 測驗的歷史紀錄 State ---
  const [historicalData, setHistoricalData] = useState<HistoricalTrendData[]>([]);
  const [trendChartData, setTrendChartData] = useState<TrendChartDataPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const userId = "17yNY7EQwUOK9Ai8O0fFIVhED1J3";

    const testsCollectionRef = collection(db, "Users", userId, "tests");
    // --- 變更: 查詢 "所有" 測驗，不再 limit(1) ---
    const allTestsQuery = query(
      testsCollectionRef,
      orderBy("startTimestamp", "desc") // 仍然排序，最新的在最前面
    );

    const unsubscribe = onSnapshot(allTestsQuery, async (allTestsSnapshot) => {
      try {
        if (allTestsSnapshot.empty) {
          setError(new Error(`使用者 ${userId} 沒有任何測驗紀錄`));
          setIsLoading(false);
          return;
        }

        // --- 變更: 繁重的資料處理開始 ---

        // 1. 處理 "RiskAssessment" 的資料 (輕量)
        const trendDataForRisk = allTestsSnapshot.docs
          .map(doc => ({
            score: doc.data().totalScore,
            date: doc.data().startTimestamp.toDate()
          }))
          .reverse(); // 變為時間正序
        setHistoricalData(trendDataForRisk);

        // 2. 處理 "TrendChart" 的資料 (重量級)
        // 我們將遍歷 "所有" 測驗，並為 "每一筆" 抓取 "levelResults"
        const chartDataPromises = allTestsSnapshot.docs.map(async (testDoc) => {
          const testData = testDoc.data();
          const levelsSnapshot = await getDocs(collection(db, testDoc.ref.path, "levelResults"));

          // a. 建立此單次測驗的分數對照表
          const testScores: { [mmseTestName: string]: { score: number, maxScore: number } } = {};
          levelsSnapshot.forEach(levelDoc => {
            const levelId = levelDoc.id;
            const levelData = levelDoc.data();
            const mmseIndex = levelIdToMmseIndex[levelId];
            if (mmseIndex !== undefined) {
              const mmseItem = defaultMmseResults[mmseIndex];
              testScores[mmseItem.test] = {
                score: levelData.score,
                maxScore: mmseItem.maxScore
              };
            }
          });

          // b. 計算五大領域分數
          const domainScores = { '定向力': 0, '記憶力': 0, '注意力': 0, '語言能力': 0, '視覺空間': 0 };
          cognitiveDomains.forEach(domain => {
            domain.tests.forEach(testName => {
              if (testScores[testName]) {
                domainScores[domain.name] += testScores[testName].score;
              }
            });
          });

          // c. 回傳圖表所需物件
          return {
            month: formatTrendDate(testData.startTimestamp.toDate()),
            總分: testData.totalScore,
            ...domainScores
          };
        });
        
        // 等待所有歷史資料都處理完畢
        const processedChartData = await Promise.all(chartDataPromises);
        setTrendChartData(processedChartData.reverse()); // 變為時間正序

        // --- 變更結束 ---

        // --- 3. 處理 "最新一筆" 測驗的詳細資料 (給儀表板上半部) ---
        // (這部分邏輯與您上一版完全相同，只是我們從 allTestsSnapshot 中取第0筆)
        const latestTestDoc = allTestsSnapshot.docs[0];
        const latestTestId = latestTestDoc.id;
        const latestTestData = latestTestDoc.data();
        
        let combinedPatientData = { ...defaultPatientData };
        let combinedMmseResults = defaultMmseResults.map(item => ({ ...item }));

        const userDocRef = doc(db, "Users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          combinedPatientData.name = userData.name || userData.email || combinedPatientData.name;
          combinedPatientData.age = userData.age || combinedPatientData.age;
          combinedPatientData.gender = userData.gender || combinedPatientData.gender;
        }

        if (latestTestData.startTimestamp) {
          combinedPatientData.testDate = latestTestData.startTimestamp.toDate().toLocaleString('zh-TW');
        }
        combinedPatientData.totalScore = latestTestData.totalScore ?? combinedPatientData.totalScore;
        combinedPatientData.testDuration = latestTestData.totalTime ?? combinedPatientData.testDuration;

        const levelsCollectionRef = collection(db, "Users", userId, "tests", latestTestId, "levelResults");
        const levelsSnapshotForLatest = await getDocs(levelsCollectionRef); // 抓取最新一筆的levelResults

        if (!levelsSnapshotForLatest.empty) {
          levelsSnapshotForLatest.forEach((levelDoc) => {
            const levelId = levelDoc.id;
            const levelData = levelDoc.data();
            const mmseIndex = levelIdToMmseIndex[levelId];
            
            if (mmseIndex !== undefined) {
              const targetItem = combinedMmseResults[mmseIndex];
              targetItem.score = levelData.score ?? targetItem.score;
              targetItem.audioUrls = [];
              if (levelData.files) {
                const files = levelData.files;
                if (levelId === 'level_1') targetItem.imageUrl = files.userPngUrl || targetItem.imageUrl;
                if (levelId === 'level_3') if (files.sentence_wavUrl) targetItem.audioUrls.push(files.sentence_wavUrl);
                if (levelId === 'level_5') {
                  if (files.voice_1Url) targetItem.audioUrls.push(files.voice_1Url);
                  if (files.voice_2Url) targetItem.audioUrls.push(files.voice_2Url);
                }
                if (levelId === 'level_6') if (files['重複語句_wavDataUrl']) targetItem.audioUrls.push(files['重複語句_wavDataUrl']);
                if (levelId === 'level_7') {
                  for (const key in files) if (key.startsWith('減法運算_Q') && key.endsWith('.wavUrl')) targetItem.audioUrls.push(files[key]);
                  targetItem.audioUrls.sort();
                }
              }
              if (levelId === 'level_10') {
                const chosen = levelData.chosenOption?.option;
                const correct = levelData.correctOption?.option;
                if (chosen !== correct) targetItem.description = `患者選擇了 "${chosen}"，但正確答案是 "${correct}"。`;
                else targetItem.description = `患者正確選擇了 "${chosen}"。`;
              }
            }
          });
        }
        
        setPatientData(combinedPatientData);
        setMmseResults(combinedMmseResults);
        setError(null);

      } catch (err: any) {
        console.error("處理即時資料更新時失敗:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Firebase 監聽器發生錯誤:", error);
      setError(error);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };

  }, []);

  // (您的 JSX 渲染部分... )
  if (isLoading) { /* ... */ }
  if (error) { /* ... */ }

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
        
        {/* 這些元件仍然只顯示 "最新" 的資料 */}
        <PatientInfoCard patient={patientData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <MMSERadarChart data={mmseResults} />
          </div>
          <div className="lg:col-span-1">
            <HandMovementVisualization />
          </div>
        </div>
        <CognitiveScoreCards scores={mmseResults} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- 變更: 傳入 "historicalData" (總分歷史) --- */}
          <RiskAssessment 
            totalScore={patientData.totalScore} 
            trendData={historicalData} 
          />
          
          {/* --- 變更: 傳入 "trendChartData" (分項歷史) --- */}
          <TrendChart data={trendChartData} />
        </div>
      </div>
    </div>
  );
};

export default Index;