// src/pages/Index.tsx

import { useState, useEffect } from "react";
// 匯入所有需要的 Firestore 函式
import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";

// 匯入您的所有元件
import { PatientInfoCard } from "@/components/PatientInfoCard";
import { MMSERadarChart } from "@/components/MMSERadarChart";
// 匯入 HandMovementVisualization 及其類型
import { 
  HandMovementVisualization, 
  type HandDataPoint, 
  // type HandMetrics // 已移除
} from "@/components/HandMovementVisualization";
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

// --- 複製 CognitiveScoreCards 的分域設定，用於計算歷史資料 ---
const cognitiveDomains = [
  { name: "定向力", tests: ["定向力(時間)", "定向力(地點)"] },
  { name: "記憶力", tests: ["短期記憶", "近期記憶"] },
  { name: "注意力", tests: ["注意力"] },
  { name: "語言能力", tests: ["命名", "重複語句", "理解指令", "理解文字", "語句完整度"] },
  { name: "視覺空間", tests: ["畫圖"] }
];

// --- 匯出 HistoricalTrendData 型別 ---
export interface HistoricalTrendData {
  score: number;
  date: Date;
}

// --- 匯出 TrendChartDataPoint 型別 ---
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


// --- 新增 CSV 解析函式 ---
/**
 * 解析從 Firebase Storage 下載的軌跡 CSV 檔案。
 * 格式: Type,X,Y,Z,Time,TriggerPressed
 */
const parseTrajectoryCsv = (csvText: string): HandDataPoint[] => {
  const dataPoints: HandDataPoint[] = [];
  // 用 '\n' (換行) 拆分每一行，並過濾掉空行
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // 從索引 1 開始，跳過標頭 (Header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const cols = line.split(',');

    // 確保 CSV 格式正確 (6 欄)
    if (cols.length === 6) {
      const type = cols[0];
      // 確保 Type 是我們需要的
      if (type === "RightHand" || type === "LeftHand") {
        dataPoints.push({
          type: type,
          x: parseFloat(cols[1]),
          y: parseFloat(cols[2]),
          z: parseFloat(cols[3]),
          time: parseFloat(cols[4]),
          triggerPressed: parseFloat(cols[5]) // 0 或 1
        });
      }
    }
  }
  return dataPoints;
};
// --- CSV 解析函式結束 ---


const Index = () => {
  // State for latest data
  const [patientData, setPatientData] = useState(defaultPatientData);
  const [mmseResults, setMmseResults] = useState(defaultMmseResults);
  
  // --- 為 HandMovementVisualization 新增 state ---
  const [handMovementData, setHandMovementData] = useState<HandDataPoint[]>([]);
  // const [handMetrics, setHandMetrics] = useState<HandMetrics>({ ... }); // 已移除

  // --- 建立 "所有" 測驗的歷史紀錄 State ---
  const [historicalData, setHistoricalData] = useState<HistoricalTrendData[]>([]);
  const [trendChartData, setTrendChartData] = useState<TrendChartDataPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const userId = "17yNY7EQwUOK9Ai8O0fFIVhED1J3";

    const testsCollectionRef = collection(db, "Users", userId, "tests");
    // --- 查詢 "所有" 測驗，不再 limit(1) ---
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

        // --- 繁重的資料處理開始 ---

        // 1. 處理 "RiskAssessment" 的資料 (輕量)
        const trendDataForRisk = allTestsSnapshot.docs
          .map(doc => ({
            score: doc.data().totalScore,
            date: doc.data().startTimestamp.toDate()
          }))
          .reverse(); // 變為時間正序
        setHistoricalData(trendDataForRisk);

        // 2. 處理 "TrendChart" 的資料 (重量級)
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

        // --- 歷史資料處理結束 ---

        // --- 3. 處理 "最新一筆" 測驗的詳細資料 (給儀表板上半部) ---
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
          
          // 初始化手部資料變數
          let latestHandData: HandDataPoint[] = [];
          // let latestHandMetrics: HandMetrics = { ... }; // 已移除

          // --- 使用 for...of 迴圈來正確處理 'await' ---
          for (const levelDoc of levelsSnapshotForLatest.docs) {
            const levelId = levelDoc.id;
            const levelData = levelDoc.data();
            
            // --- 專門處理 level_1 的手部資料 (包含 fetch) ---
            if (levelId === 'level_1') {
              const csvUrl = levelData.files?.trajectoryCsvUrl;
              
              if (csvUrl) {
                console.log("偵測到軌跡 CSV，正在下載:", csvUrl);
                try {
                  // 1. 下載 CSV 檔案
                  const response = await fetch(csvUrl);
                  if (!response.ok) {
                    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
                  }
                  const csvText = await response.text();
                  
                  // 2. 解析 CSV 文字
                  latestHandData = parseTrajectoryCsv(csvText);
                  console.log(`成功解析 ${latestHandData.length} 筆軌跡資料`);

                } catch (e) {
                  console.error("抓取或解析軌跡 CSV 失敗:", e);
                  latestHandData = []; // 確保失敗時是空陣列
                }
              }
              
              // 這些指標仍在 level_1 文件上 (已移除)
              // latestHandMetrics.avgSpeed = levelData.averageSpeed ?? 0; // 已移除
              // latestHandMetrics.suggestions = levelData.aiSuggestions ?? [...]; // 已移除
            }
            // --- 手部資料處理結束 ---

            // --- MMSE 分數與檔案處理 ---
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
            // --- MMSE 處理結束 ---
          }
          // --- for...of 迴圈結束 ---

          // --- 在迴圈 "之後" 設定 state ---
          setHandMovementData(latestHandData);
          // setHandMetrics(latestHandMetrics); // 已移除
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

  }, []); // 空依賴陣列，確保 useEffect 只執行一次

  // (您的 JSX 渲染部分... )
  if (isLoading) { 
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-primary text-lg">載入中，請稍候...</div>
      </div>
    );
  }

  if (error) { 
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-destructive text-lg">
          資料載入失敗: {error.message}
        </div>
      </div>
    );
  }

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
            {/* 傳入真實的、解析過的 CSV 資料 (已移除 metrics) */}
            <HandMovementVisualization 
              handData={handMovementData} 
              // metrics={handMetrics} // 已移除
            />
          </div>
        </div>
        <CognitiveScoreCards scores={mmseResults} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- 傳入 "historicalData" (總分歷史) --- */}
          <RiskAssessment 
            totalScore={patientData.totalScore} 
            trendData={historicalData} 
          />
          
          {/* --- 傳入 "trendChartData" (分項歷史) --- */}
          <TrendChart data={trendChartData} />
        </div>
      </div>
    </div>
  );
};

export default Index;