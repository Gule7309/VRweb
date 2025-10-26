// public/analysis.worker.js

// 1. 引入庫 (與之前相同)
try {
    importScripts(
      "https://cdn.jsdelivr.net/npm/fili@2.0.3/dist/fili.min.js",
      "https://cdn.jsdelivr.net/npm/fft.js@4.0.4/dist/fft.min.js"
    );
  } catch (e) {
    console.error("Failed to import scripts:", e);
  }
  
  // 2. 主監聽函數 (修改)
  self.onmessage = (event) => {
    const { csvData, handType, targetSampleRate, taskType } = event.data;
    // taskType: 'tapping', 'reaching', or 'tremor-only'
  
    if (!csvData) return;
  
    try {
      // 步驟 A: 解析數據 (修改：增加 trigger)
      const { time, x, y, z, trigger } = parseAndSeparate(csvData, handType);
      if (time.length < 20) throw new Error("數據點不足");
  
      // 步驟 B: 重採樣 (與之前相同)
      const fs = targetSampleRate;
      const { resampledTime, resampledX, resampledY, resampledZ, resampledTrigger } =
        resampleData(time, x, y, z, trigger, fs);
  
      // --- 震顫分析 (與之前相同) ---
      const filteredX = applyBandpass(resampledX, fs, 3, 12);
      const filteredY = applyBandpass(resampledY, fs, 3, 12);
      const filteredZ = applyBandpass(resampledZ, fs, 3, 12);
      
      const tremorMetrics = calculateTremorMetrics(
        filteredX, filteredY, filteredZ, fs
      );
  
      // --- 穩定性分析 (新增) ---
      let stabilityMetrics = {};
      if (taskType && taskType !== 'tremor-only') {
        // 步驟 C: 分割試驗 (Trial Segmentation)
        const trials = segmentTrials(resampledTime, resampledTrigger);
        
        if (trials.length < 2) {
          console.warn("試驗次數不足 ( < 2)，無法計算穩定性");
        } else {
          // 步驟 D: 根據任務類型計算穩定性
          stabilityMetrics = calculateStabilityMetrics(
            taskType,
            trials,
            resampledX,
            resampledY,
            resampledZ
          );
        }
      }
  
      // 步驟 E: 合併回傳結果
      self.postMessage({
        status: 'success',
        data: {
          ...tremorMetrics,  // { peakFrequency, tremorAmplitude, ... }
          ...stabilityMetrics // { tappingCV, pathRMSD, endpointSD, ... }
        }
      });
  
    } catch (error) {
      self.postMessage({ status: 'error', message: error.message });
    }
  };
  
  // --- 輔助函數 (修改與新增) ---
  
  /** * 步驟 A: 解析 (修改) 
   * 假設 CSV 格式: Type,X,Y,Z,Time,TriggerPressed (第6欄)
   */
  function parseAndSeparate(csvData, handType) {
    const lines = csvData.trim().split('\n');
    const time = [], x = [], y = [], z = [], trigger = [];
  
    lines.slice(1).forEach(line => {
      const parts = line.split(',');
      if (parts[0] === handType) {
        x.push(parseFloat(parts[1]));
        y.push(parseFloat(parts[2]));
        z.push(parseFloat(parts[3]));
        time.push(parseFloat(parts[4]));
        trigger.push(parseFloat(parts[5])); // 新增 Trigger
      }
    });
    return { time, x, y, z, trigger };
  }
  
  /** * 步驟 B: 重採樣 (修改)
   */
  function resampleData(time, x, y, z, trigger, fs) {
    const resampledTime = [], resampledX = [], resampledY = [], resampledZ = [], resampledTrigger = [];
    const dt = 1 / fs;
    const startTime = time[0];
    const endTime = time[time.length - 1];
  
    let currentTime = startTime;
    let i = 1;
  
    while (currentTime <= endTime) {
      while (i < time.length && time[i] < currentTime) { i++; }
      if (i >= time.length) break;
  
      const t1 = time[i - 1], t2 = time[i];
      const frac = (currentTime - t1) / (t2 - t1);
  
      resampledX.push(x[i - 1] + (x[i] - x[i - 1]) * frac);
      resampledY.push(y[i - 1] + (y[i] - y[i - 1]) * frac);
      resampledZ.push(z[i - 1] + (z[i] - z[i - 1]) * frac);
      
      // Trigger 是 0/1 訊號，使用 "最近鄰" 插值法 (取前一個值)
      resampledTrigger.push(trigger[i - 1]); 
      resampledTime.push(currentTime);
      currentTime += dt;
    }
    return { resampledTime, resampledX, resampledY, resampledZ, resampledTrigger };
  }
  
  /** * 步驟 C: 分割試驗 (NEW)
   * 找出 "TriggerPressed" 從 0 變到 1 的 "那個時間點"
   * 這代表一次點擊 (tap) 或一次到達 (reach)
   */
  function segmentTrials(time, trigger) {
    const trials = []; // 儲存每次 "按下" 的事件
    let wasPressed = false;
  
    for (let i = 0; i < trigger.length; i++) {
      const isPressed = trigger[i] === 1;
      if (isPressed && !wasPressed) {
        // 偵測到 0 -> 1 的上升緣
        trials.push({
          time: time[i],
          index: i
        });
      }
      wasPressed = isPressed;
    }
    return trials; // 返回 [ {time, index}, {time, index}, ... ]
  }
  
  /** * 步驟 D: 穩定性計算主函數 (NEW)
   */
  function calculateStabilityMetrics(taskType, trials, x, y, z) {
    if (taskType === 'tapping') {
      return calculateTappingCV(trials);
    }
    if (taskType === 'reaching') {
      return calculateReachingStability(trials, x, y, z);
    }
    return {};
  }
  
  /** * 實作 (Tapping CV) - 您的文獻第 2, 8 點 (NEW)
   */
  function calculateTappingCV(trials) {
    const interTapIntervals = []; // 儲存每次點擊的 "間隔時間"
    for (let i = 1; i < trials.length; i++) {
      const interval = trials[i].time - trials[i - 1].time;
      interTapIntervals.push(interval);
    }
  
    if (interTapIntervals.length === 0) return { tappingCV: 0 };
    
    const { mean, sd } = getMeanSD(interTapIntervals);
    
    // CV = (SD / Mean) * 100%
    const tappingCV = (mean === 0) ? 0 : (sd / mean) * 100;
    
    return {
      tappingCV: tappingCV,       // 節律變異係數 (%)
      meanITI: mean,              // 平均點擊間隔 (s)
      sdITI: sd,                  // 點擊間隔標準差 (s)
      trialCount: trials.length   // 總點擊次數
    };
  }
  
  /** * 實作 (Reaching Stability) - 您的文獻第 1, 3 點 (NEW)
   */
  function calculateReachingStability(trials, x, y, z) {
    const endpoints = []; // 每次到達的終點 (X,Y,Z)
    const pathRMSD_list = []; // 每次路徑的 RMSD
    const movementTimes = []; // 每次移動的時間
    
    // 假設試驗是 "從前一個點，移動到下一個點"
    for (let i = 1; i < trials.length; i++) {
      const startTrial = trials[i - 1];
      const endTrial = trials[i];
  
      // 1. 終點位置 (Endpoint Position)
      const endPos = { 
        x: x[endTrial.index], 
        y: y[endTrial.index], 
        z: z[endTrial.index] 
      };
      endpoints.push(endPos);
      
      // 2. 移動時間 (Movement Time)
      movementTimes.push(endTrial.time - startTrial.time);
  
      // 3. 路徑 RMSD (Path RMSD) - (您的第 3 點)
      const startPos = { 
        x: x[startTrial.index], 
        y: y[startTrial.index], 
        z: z[startTrial.index] 
      };
      
      const distances = [];
      // 遍歷 "這一次" 試驗中的 "所有" 軌跡點
      for (let j = startTrial.index; j <= endTrial.index; j++) {
        const currentPos = { x: x[j], y: y[j], z: z[j] };
        // 計算 "當前點" 到 "理想直線 (起點-終點)" 的垂直距離
        const dist = getPerpendicularDistance(currentPos, startPos, endPos);
        distances.push(dist**2);
      }
      
      const rmsd = Math.sqrt(getMeanSD(distances).mean); // 均方根偏差
      pathRMSD_list.push(rmsd);
    }
    
    // --- 匯總計算 ---
    
    // 終點標準差 (Endpoint SD) - (您的第 1 點)
    // 計算 3D 空間中所有終點的 "質心"
    const meanEndpoint = {
      x: getMeanSD(endpoints.map(p => p.x)).mean,
      y: getMeanSD(endpoints.map(p => p.y)).mean,
      z: getMeanSD(endpoints.map(p => p.z)).mean,
    };
    
    // 計算每個終點到 "質心" 的距離
    const endpointDistances = endpoints.map(p => getDistance3D(p, meanEndpoint));
    // 終點的標準差 (SD)
    const endpointSD = getMeanSD(endpointDistances).sd;
  
    // 路徑 RMSD 的平均值
    const meanPathRMSD = getMeanSD(pathRMSD_list).mean;
    
    // 移動時間的變異係數 (CV) - (您的第 2 點)
    const timeStats = getMeanSD(movementTimes);
    const timeCV = (timeStats.mean === 0) ? 0 : (timeStats.sd / timeStats.mean) * 100;
  
    return {
      endpointSD: endpointSD, // 終點位置標準差 (m) - 一致性
      pathRMSD: meanPathRMSD, // 平均路徑均方根偏差 (m) - 平滑度/精確度
      timeCV: timeCV,         // 移動時間變異係數 (%) - 一致性
      trialCount: trials.length
    };
  }
  
  
  // --- 震顫計算 (與之前相同) ---
  function calculateTremorMetrics(filtX, filtY, filtZ, fs) {
    // ... (省略與前一回答相同的程式碼) ...
    // 1. 震顫振幅 (Tremor Amplitude)
    const tremorMagnitude = filtX.map((val, i) => Math.sqrt(val**2 + filtY[i]**2 + filtZ[i]**2));
    const rmsSum = tremorMagnitude.reduce((acc, val) => acc + val**2, 0);
    const tremorAmplitude = Math.sqrt(rmsSum / tremorMagnitude.length);
    const tremorAmplitudeCm = tremorAmplitude * 100;
  
    // 2. 主頻率 (Peak Frequency)
    const N = 1024;
    const fft = new Fft.default.Complex(N);
    const input = new Float64Array(N).fill(0);
    input.set(tremorMagnitude.slice(0, N));
    const spectrum = new Float64Array(N * 2);
    fft.transform(spectrum, input);
    
    let maxPower = -Infinity;
    let peakBin = -1;
    const fLowBin = Math.floor(3 * N / fs);
    const fHighBin = Math.ceil(12 * N / fs);
  
    for (let i = fLowBin; i <= fHighBin; i++) {
      const p = spectrum[i * 2]**2 + spectrum[i * 2 + 1]**2;
      if (p > maxPower) {
        maxPower = p;
        peakBin = i;
      }
    }
    const peakFrequency = (peakBin * fs) / N;
    
    return {
      peakFrequency: peakFrequency,
      tremorAmplitude: tremorAmplitudeCm,
      tremorPower: maxPower,
    };
  }
  
  function applyBandpass(data, fs, fLow, fHigh) {
    // ... (省略與前一回答相同的程式碼) ...
    const fili = new Fili.default();
    const butterworth = fili.butterworth({ order: 5, characteristic: 'bandpass', Fs: fs, Fc: (fLow + fHigh) / 2, BW: fHigh - fLow });
    return butterworth.multiStep(data);
  }
  
  
  // --- 數學工具函數 (NEW) ---
  
  function getMeanSD(data) {
    if (data.length === 0) return { mean: 0, sd: 0 };
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    const variance = data.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (data.length - 1);
    const sd = Math.sqrt(variance);
    return { mean, sd: sd || 0 }; // 處理 data.length = 1 的情況
  }
  
  function getDistance3D(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
  }
  
  // 向量幾何：計算點 P 到 "AB直線" 的垂直距離
  function getPerpendicularDistance(p, a, b) {
    const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    
    const magAB2 = ab.x**2 + ab.y**2 + ab.z**2;
    if (magAB2 === 0) return getDistance3D(p, a); // 起點終點重合
  
    const dot = ap.x * ab.x + ap.y * ab.y + ap.z * ab.z;
    const t = Math.max(0, Math.min(1, dot / magAB2)); // 投影點在線段上的比例
  
    // 投影點
    const projection = {
      x: a.x + t * ab.x,
      y: a.y + t * ab.y,
      z: a.z + t * ab.z,
    };
    
    return getDistance3D(p, projection);
  }