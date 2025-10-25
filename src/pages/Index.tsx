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

const defaultMmseResults = [
  // 索引 0
  { test: "定向力(時間)", score: 3, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 1
  { test: "定向力(地點)", score: 5, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 2
  { test: "短期記憶", score: 3, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 3
  { test: "注意力", score: 3, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 4
  { test: "近期記憶", score: 2, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 5
  { test: "命名", score: 2, maxScore: 2, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 6
  { test: "重複語句", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 7
  { test: "理解指令", score: 2, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 8
  { test: "理解文字", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 9
  { test: "語句完整度", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  // 索引 10
  { test: "畫圖", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
];

// 1. 建立一個從 Firebase level ID 到 mmseResults 陣列索引的 "對應表"
// (這已根據您的最新列表更新)
const levelIdToMmseIndex: { [key: string]: number } = {
  // 'Firebase文件ID': 陣列索引 (來自 defaultMmseResults)
  'level_2': 0,        // 定向力(時間)
  'level_9': 1,        // 定向力(地點)
  'level_8_Round1': 2, // 短期記憶
  'level_7': 3,        // 注意力 (算數)
  'level_8_Round2': 4, // 近期記憶
  'level_5': 5,        // 命名
  'level_6': 6,        // 重複語句
  'level_4': 7,        // 理解指令 (您列表中的 Level 4)
  'level_10': 8,       // 理解文字 (您列表中的 Level 10)
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
    const userId = "17yNY7EQwUOK9Ai8O0fFIVhED1J3";

    const testsCollectionRef = collection(db, "Users", userId, "tests");
    const latestTestQuery = query(
      testsCollectionRef,
      orderBy("startTimestamp", "desc"),
      limit(1)
    );

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
        // 從資料庫讀取真實的 totalScore 和 totalTime
        combinedPatientData.totalScore = latestTestData.totalScore ?? combinedPatientData.totalScore;
        combinedPatientData.testDuration = latestTestData.totalTime ?? combinedPatientData.testDuration;
        // (您可以稍後在此處添加 vrDevice 等欄位)

        // --- 4. 填入 "levelResults" 的詳細資料 ---
        const levelsCollectionRef = collection(db, "Users", userId, "tests", latestTestId, "levelResults");
        const levelsSnapshot = await getDocs(levelsCollectionRef);

        if (!levelsSnapshot.empty) {
          levelsSnapshot.forEach((levelDoc) => {
            const levelId = levelDoc.id; // "level_0", "level_1", "level_8_Round1" ...
            const levelData = levelDoc.data();
            
            // 使用我們的 "對應表" 找到它在陣列中的位置
            const mmseIndex = levelIdToMmseIndex[levelId];
            
            if (mmseIndex !== undefined) {
              // 找到了對應位置，開始填入詳細資料
              const targetItem = combinedMmseResults[mmseIndex];
              
              // A. 填入分數
              targetItem.score = levelData.score ?? targetItem.score;
              
              // B. 填入檔案 (音檔、圖片等)
              if (levelData.files) {
                if (levelId === 'level_1') { // 視覺建構
                  targetItem.imageUrl = levelData.files.userPngUrl || targetItem.imageUrl;
                  // 您也可以在這裡儲存 trajectoryCsvUrl，雖然卡片上可能用不到
                }
                if (levelId === 'level_3') { // 書寫
                  targetItem.audioUrl = levelData.files.sentence_wavUrl || targetItem.audioUrl;
                }
                if (levelId === 'level_5') { // 複述
                  // 您的 level_5 有 voice_1Url 和 voice_2Url，這裡先用第1個
                  targetItem.audioUrl = levelData.files.voice_1Url || targetItem.audioUrl;
                }
                if (levelId === 'level_6') { // 閱讀
                  targetItem.audioUrl = levelData.files['重述語句_wavDataUrl'] || targetItem.audioUrl;
                }
                if (levelId === 'level_7') { // 注意力
                  // 這裡有多個音檔，先用第1個
                  targetItem.audioUrl = levelData.files['減法運算_Q1_wavData.wavUrl'] || targetItem.audioUrl;
                }
              }

              // C. [可選] 覆蓋描述文字
              // 您可以根據 chosenOption 和 correctOption 來產生新的 description
              if (levelId === 'level_10') { // 閱讀
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
          
          // [重要] 我們不再重新計算總分，而是直接使用資料庫中的 'totalScore'
          // (combinedPatientData.totalScore = combinedMmseResults.reduce(...)) 已被移除
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
          <div className="lg-col-span-1">
            <MMSERadarChart data={mmseResults} />
          </div>
          <div className="lg-col-span-1">
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