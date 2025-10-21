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
  // ... (您的 11 個測驗項目假資料) ...
  { test: "定向力(時間)", score: 4, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "定向力(地點)", score: 5, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "即時記憶", score: 3, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "注意力與計算", score: 3, maxScore: 5, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "延遲記憶", score: 2, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "命名", score: 2, maxScore: 2, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "複述", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "三步驟指令", score: 2, maxScore: 3, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "閱讀", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "書寫", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
  { test: "視覺建構", score: 1, maxScore: 1, audioUrl: "...", imageUrl: "...", description: "..." },
];

const Index = () => {
  const [patientData, setPatientData] = useState(defaultPatientData);
  const [mmseResults, setMmseResults] = useState(defaultMmseResults);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // --- 最終版的 useEffect ---
  useEffect(() => {
    const userId = "17yNY7EQwUOK9Ai8O0fFIVhED1J3";

    // 2. 建立查詢 (這部分不變)
    const testsCollectionRef = collection(db, "Users", userId, "tests");
    const latestTestQuery = query(
      testsCollectionRef,
      orderBy("startTimestamp", "desc"),
      limit(1)
    );

    // 3. 將 getDocs 替換為 onSnapshot
    // onSnapshot 會回傳一個 "unsubscribe" 函式，我們用它來在元件卸載時關閉監聽
    const unsubscribe = onSnapshot(latestTestQuery, async (testsSnapshot) => {
      try {
        if (testsSnapshot.empty) {
          setError(new Error(`使用者 ${userId} 沒有任何測驗紀錄`));
          setIsLoading(false);
          return;
        }

        // 當有新測驗時，這裡的程式碼會被 "自動" 重新執行
        const latestTestDoc = testsSnapshot.docs[0];
        const latestTestId = latestTestDoc.id;
        const latestTestData = latestTestDoc.data();
        
        // (後續的資料處理邏輯完全一樣)
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

        const levelsCollectionRef = collection(db, "Users", userId, "tests", latestTestId, "levelResults");
        const levelsSnapshot = await getDocs(levelsCollectionRef);

        if (!levelsSnapshot.empty) {
          levelsSnapshot.forEach((levelDoc) => {
            const levelId = levelDoc.id;
            const levelIndex = parseInt(levelId.split('_')[1]);
            if (!isNaN(levelIndex) && levelIndex < combinedMmseResults.length) {
              combinedMmseResults[levelIndex].score = levelDoc.data().score ?? combinedMmseResults[levelIndex].score;
            }
          });
          combinedPatientData.totalScore = combinedMmseResults.reduce((sum, item) => sum + item.score, 0);
        }
        
        setPatientData(combinedPatientData);
        setMmseResults(combinedMmseResults);
        setError(null); // 清除舊的錯誤

      } catch (err: any) {
        console.error("處理即時資料更新時失敗:", err);
        setError(err);
      } finally {
        setIsLoading(false); // 不論如何，結束載入狀態
      }
    }, (error) => {
        // onSnapshot 的第二個參數是錯誤處理函式
        console.error("Firebase 監聽器發生錯誤:", error);
        setError(error);
        setIsLoading(false);
    });

    // 4. useEffect 現在會回傳一個 "清理函式 (Cleanup Function)"
    // 當元件要從畫面上移除時 (例如使用者跳到別的頁面)，React 會呼叫這個函式
    // 我們在這裡關閉監聽，以避免記憶體洩漏和不必要的網路連線
    return () => {
      unsubscribe();
    };

  }, []); // 空陣列仍然保留，因為我們只需要 "設定" 這個監聽器一次

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