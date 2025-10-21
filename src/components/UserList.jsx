import React, { useState, useEffect } from 'react';
// 1. 匯入 db (請再次確認路徑是否正確)
import { db } from '../firebase'; // <-- 假設路徑是 '../firebase'

// 2. 匯入 Firebase SDK 函式
import { collection, getDocs } from 'firebase/firestore';

function UserList() {
  // 3. 建立 state
  const [users, setUsers] = useState([]); // 儲存使用者資料
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 4. 使用 useEffect 在元件載入時自動抓取資料
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // --- 這裡是要修改的地方 ---
        // 將集合名稱從 "projects" 改成 "Users"
        const querySnapshot = await getDocs(collection(db, 'Users')); 
        // -------------------------

        // 將抓回來的資料轉換成陣列
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 5. 將資料存入 state
        setUsers(usersData);

      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers(); // 執行
  }, []); // [] 空陣列，只執行一次

  // 6. 根據 state 狀態顯示不同內容
  
  // 狀態一：載入中
  if (isLoading) {
    return <div className="p-10 text-center text-gray-400">資料載入中...</div>;
  }

  // 狀態二：發生錯誤
  if (error) {
    return <div className="p-10 text-center bg-red-100 text-red-700">無法載入資料：{error.message}</div>;
  }

  // 狀態三：成功載入資料，開始渲染列表
  return (
    <div className="container mx-auto p-4">
      {/* 使用 Tailwind 建立格線 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* --- 這裡是主要修改的地方 ---
          將 'projects.map' 改為 'users.map'
          並渲染 'user' 物件中的 email, age, gender 欄位
        */}
        {users.map(user => (
          <div 
            key={user.id} // key 依然是 React 必需的
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-500">Email</span>
              <span className="text-xl font-semibold text-gray-900">{user.email}</span>
            </div>
            
            <div className="flex justify-between">
              <div>
                <span className="block text-sm font-medium text-gray-500">年齡</span>
                <span className="text-lg text-gray-800">{user.age}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">性別</span>
                <span className="text-lg text-gray-800">{user.gender}</span>
              </div>
            </div>
            
            {/* 如果您也想顯示 createdAt (時間戳) */}
            {/* <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-400">
                建立時間: {user.createdAt ? user.createdAt.toDate().toLocaleString('zh-TW') : 'N/A'}
              </span>
            </div>
            */}
          </div>
        ))}
        {/* ------------------------- */}

      </div>
    </div>
  );
}

export default UserList;