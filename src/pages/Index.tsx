import { useState, useEffect } from "react";
// 匯入所有需要的 Firestore 函式
import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, onSnapshot } from "firebase/firestore";

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

// 1. 建立一個從 Firebase level ID 到 mmseResults 陣列索引的 "對應表"
// (已根據您的最新列表更新)
const levelIdToMmseIndex: { [key: string]: number } = {
  // 'Firebase文件ID': 陣列索引 (來自 defaultMmseResults)
  'level_2': 0,        // 定向力(時間)
  'level_9': 1,        // 定向力(地點)
  'level_8_Round1': 2, // 短期記憶
  'level_7': 3,        // 注意力 (算數)
  'level_8_Round2': 4, // 近期記憶
  'level_5': 5,        // 命名
  'level_6': 6,        // 重複語句
  'level_4': 7,        // 理解指令
  'level_10': 8,       // 理解文字
  'level_3': 9,        // 語句完整度
  'level_1': 10,       // 畫圖
  
  // level_0 (規則) 沒有對應到 MMSE 項目，所以會被忽略
};

const Index = () => {
  const [patientData, setPatientData] = useState(defaultPatientData);
  const [mmseResults, setMmseResults] = useState(defaultMmseResults);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 您的 User ID
    const userId = "17yNY7EQwUOK9Ai8O0fFIVhED1J3";

    // 建立查詢，尋找最新的測驗
    const testsCollectionRef = collection(db, "Users", userId, "tests");
    const latestTestQuery = query(
      testsCollectionRef,
      orderBy("startTimestamp", "desc"),
      limit(1)
    );

    // 使用 onSnapshot 建立即時監聽
    const unsubscribe = onSnapshot(latestTestQuery, async (testsSnapshot) => {
      try {
        if (testsSnapshot.empty) {
          setError(new Error(`使用者 ${userId} 沒有任何測驗紀錄`));
          setIsLoading(false);
          return;
        }

        const latestTestDoc = testsSnapshot.docs[0];
        const latestTestId = latestTestDoc.id;
        const latestTestData = latestTestDoc.data();
        
        // 準備好預設的資料
        let combinedPatientData = { ...defaultPatientData };
        let combinedMmseResults = defaultMmseResults.map(item => ({ ...item }));

        // --- 2. 填入使用者資料 (來自 User 文件) ---
        const userDocRef = doc(db, "Users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          combinedPatientData.name = userData.name || userData.email || combinedPatientData.name;
          combinedPatientData.age = userData.age || combinedPatientData.age;
          combinedPatientData.gender = userData.gender || combinedPatientData.gender;
        }

        // --- 3. 填入測驗總結資料 (來自 test 文件) ---
        if (latestTestData.startTimestamp) {
          combinedPatientData.testDate = latestTestData.startTimestamp.toDate().toLocaleString('zh-TW');
        }
        combinedPatientData.totalScore = latestTestData.totalScore ?? combinedPatientData.totalScore;
        combinedPatientData.testDuration = latestTestData.totalTime ?? combinedPatientData.testDuration;

        // --- 4. 填入 "levelResults" 的詳細資料 ---
        const levelsCollectionRef = collection(db, "Users", userId, "tests", latestTestId, "levelResults");
        const levelsSnapshot = await getDocs(levelsCollectionRef);

        if (!levelsSnapshot.empty) {
          levelsSnapshot.forEach((levelDoc) => {
            const levelId = levelDoc.id; // "level_0", "level_1", "level_8_Round1" ...
            const levelData = levelDoc.data();
            
            // 使用 "對應表" 找到它在陣列中的位置
            const mmseIndex = levelIdToMmseIndex[levelId];
            
            if (mmseIndex !== undefined) {
              const targetItem = combinedMmseResults[mmseIndex];
              
              // A. 填入分數
              targetItem.score = levelData.score ?? targetItem.score;
              
              // B. 填入檔案 (音檔陣列、圖片等)
              targetItem.audioUrls = []; // <-- 初始化為空陣列
              if (levelData.files) {
                const files = levelData.files; // 取得 files 物件

                if (levelId === 'level_1') { // 畫圖
                  targetItem.imageUrl = files.userPngUrl || targetItem.imageUrl;
                }
                if (levelId === 'level_3') { // 語句完整度
                  if (files.sentence_wavUrl) targetItem.audioUrls.push(files.sentence_wavUrl);
                }
                if (levelId === 'level_5') { // 命名
                  // 檢查 level_5 的所有音檔
                  if (files.voice_1Url) targetItem.audioUrls.push(files.voice_1Url);
                  if (files.voice_2Url) targetItem.audioUrls.push(files.voice_2Url);
                }
                if (levelId === 'level_6') { // 重複語句
                  if (files['重複語句_wavDataUrl']) targetItem.audioUrls.push(files['重複語句_wavDataUrl']);
                }
                if (levelId === 'level_7') { // 注意力 (算數)
                  // 遍歷 files 物件，找出所有相關音檔
                  for (const key in files) {
                    if (key.startsWith('減法運算_Q') && key.endsWith('.wavUrl')) {
                      targetItem.audioUrls.push(files[key]);
                    }
                  }
                  targetItem.audioUrls.sort(); // 對音檔排序
                }
              }

              // C. [可選] 覆蓋描述文字
              if (levelId === 'level_10') { // 理解文字
                const chosen = levelData.chosenOption?.option;
                const correct = levelData.correctOption?.option;
                if (chosen !== correct) {
                  targetItem.description = `患者選擇了 "${chosen}"，但正確答案是 "${correct}"。`;
                } else {
                  targetItem.description = `患者正確選擇了 "${chosen}"。`;
                }
              }
            }
          });
        }
        
        // --- 5. 更新 React State ---
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

    // 清理函式
    return () => {
      unsubscribe();
    };

  }, []); // 空陣列，只設定一次監聽器

  // (您的 JSX 渲染部分，完全不需變動)
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">資料載入中...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="font-bold">資料載入失敗</h2>
          <p>{error.message}</p>
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
          <RiskAssessment totalScore={patientData.totalScore} />
          <TrendChart />
        </div>
      </div>
    </div>
  );
};

export default Index;