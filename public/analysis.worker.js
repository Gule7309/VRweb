// public/analysis.worker.js

// 1. 引入庫 (從本地，使用 dsp.js)
try {
    importScripts(
      "/fili.min.js",
      "/dsp.js"       // <-- 使用 dsp.js
    );
  } catch (e) {
    console.error("Failed to import scripts:", e);
    self.postMessage({ status: 'error', message: `Worker failed to load scripts: ${e.message}` });
    throw e;
  }
  
  // 2. 主監聽函數 (保持不變)
  self.onmessage = (event) => {
    const { csvData, handType, targetSampleRate, taskType } = event.data;
    if (!csvData) return;
  
    try {
      const { time, x, y, z, trigger } = parseAndSeparate(csvData, handType);
      if (time.length < 20) throw new Error("數據點不足");
  
      const fs = targetSampleRate;
      const { resampledTime, resampledX, resampledY, resampledZ, resampledTrigger } =
        resampleData(time, x, y, z, trigger, fs);
  
      // --- 震顫分析 ---
      const filteredX = applyBandpass(resampledX, fs, 3, 12);
      const filteredY = applyBandpass(resampledY, fs, 3, 12);
      const filteredZ = applyBandpass(resampledZ, fs, 3, 12);
  
      // *** 使用 dsp.js 修改後的震顫計算 ***
      const tremorMetrics = calculateTremorMetrics(
        filteredX, filteredY, filteredZ, fs
      );
  
      // --- 穩定性分析 (保持不變) ---
      let stabilityMetrics = {};
      if (taskType && taskType !== 'tremor-only') {
        const trials = segmentTrials(resampledTime, resampledTrigger);
        if (trials.length < 2) {
          console.warn("試驗次數不足 ( < 2)，無法計算穩定性");
        } else {
          stabilityMetrics = calculateStabilityMetrics(
            taskType, trials,
            resampledX, resampledY, resampledZ
          );
        }
      }
  
      self.postMessage({
        status: 'success',
        data: { ...tremorMetrics, ...stabilityMetrics }
      });
  
    } catch (error) {
      // 確保將詳細錯誤訊息傳回主線程
      self.postMessage({ status: 'error', message: error.message || 'An unknown error occurred in the worker.' });
    }
  };
  
  // --- 輔助函數 ---
  
  // (parseAndSeparate, resampleData, segmentTrials, calculateStabilityMetrics,
  // calculateTappingCV, calculateReachingStability 與之前相同)
  function parseAndSeparate(csvData, handType) {
    const lines = csvData.trim().split('\n');
    const time = [], x = [], y = [], z = [], trigger = [];
    lines.slice(1).forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 6 && parts[0] === handType) { // 增加長度檢查
        try {
          x.push(parseFloat(parts[1]));
          y.push(parseFloat(parts[2]));
          z.push(parseFloat(parts[3]));
          time.push(parseFloat(parts[4]));
          trigger.push(parseFloat(parts[5]));
        } catch(parseError){
          console.warn('Skipping invalid CSV line:', line, parseError);
        }
      }
    });
    if (time.length === 0) {
      throw new Error(`No data found for handType "${handType}" in CSV.`);
    }
    return { time, x, y, z, trigger };
  }
  function resampleData(time, x, y, z, trigger, fs) {
    const resampledTime = [], resampledX = [], resampledY = [], resampledZ = [], resampledTrigger = [];
    const dt = 1 / fs; const startTime = time[0]; const endTime = time[time.length - 1];
    let currentTime = startTime; let i = 1;
    while (currentTime <= endTime && resampledTime.length < 50000) { // 防止無限迴圈
      while (i < time.length && time[i] < currentTime) { i++; }
      if (i >= time.length) break;
      const t1 = time[i - 1], t2 = time[i];
      // 防止除以零
      const frac = (t2 - t1 > 1e-9) ? (currentTime - t1) / (t2 - t1) : 0;
  
      resampledX.push(x[i - 1] + (x[i] - x[i - 1]) * frac);
      resampledY.push(y[i - 1] + (y[i] - y[i - 1]) * frac);
      resampledZ.push(z[i - 1] + (z[i] - z[i - 1]) * frac);
      resampledTrigger.push(trigger[i - 1]); resampledTime.push(currentTime);
      currentTime += dt;
    }
     if (resampledTime.length === 0) {
        throw new Error("Resampling resulted in zero data points. Check input time array.");
     }
    return { resampledTime, resampledX, resampledY, resampledZ, resampledTrigger };
  }
  function segmentTrials(time, trigger) {
    const trials = []; let wasPressed = false;
    for (let i = 0; i < trigger.length; i++) {
      const isPressed = trigger[i] === 1;
      if (isPressed && !wasPressed) { trials.push({ time: time[i], index: i }); }
      wasPressed = isPressed;
    }
    return trials;
  }
  function calculateStabilityMetrics(taskType, trials, x, y, z) {
    if (taskType === 'tapping') { return calculateTappingCV(trials); }
    if (taskType === 'reaching') { return calculateReachingStability(trials, x, y, z); }
    return {};
  }
  function calculateTappingCV(trials) {
    const interTapIntervals = [];
    for (let i = 1; i < trials.length; i++) { interTapIntervals.push(trials[i].time - trials[i - 1].time); }
    if (interTapIntervals.length === 0) return { tappingCV: NaN, meanITI: NaN, sdITI: NaN, trialCount: trials.length }; // Use NaN for invalid results
    const { mean, sd } = getMeanSD(interTapIntervals);
    const tappingCV = (mean === 0) ? NaN : (sd / mean) * 100;
    return { tappingCV: tappingCV, meanITI: mean, sdITI: sd, trialCount: trials.length };
  }
  function calculateReachingStability(trials, x, y, z) {
    const endpoints = []; const pathRMSD_list = []; const movementTimes = [];
    if (trials.length < 2) {
       return { endpointSD: NaN, pathRMSD: NaN, timeCV: NaN, trialCount: trials.length };
    }
    for (let i = 1; i < trials.length; i++) {
      const startTrial = trials[i - 1]; const endTrial = trials[i];
       // 確保索引有效
      if(endTrial.index >= x.length || startTrial.index < 0) {
          console.warn(`Invalid trial indices: start ${startTrial.index}, end ${endTrial.index}`);
          continue; // 跳過無效的試驗
      }
      const endPos = { x: x[endTrial.index], y: y[endTrial.index], z: z[endTrial.index] };
      endpoints.push(endPos);
      movementTimes.push(endTrial.time - startTrial.time);
      const startPos = { x: x[startTrial.index], y: y[startTrial.index], z: z[startTrial.index] };
      const distances = [];
      // 確保 j 的範圍有效
      const startIndex = Math.max(0, startTrial.index);
      const endIndex = Math.min(x.length - 1, endTrial.index);
      for (let j = startIndex; j <= endIndex; j++) {
        const dist = getPerpendicularDistance({ x: x[j], y: y[j], z: z[j] }, startPos, endPos);
        distances.push(dist**2);
      }
       if (distances.length > 0) {
          pathRMSD_list.push(Math.sqrt(getMeanSD(distances).mean));
       } else {
          pathRMSD_list.push(0); // 如果試驗內沒有數據點，偏差為0
       }
    }
  
    if (endpoints.length === 0) {
        return { endpointSD: NaN, pathRMSD: NaN, timeCV: NaN, trialCount: trials.length };
    }
  
    const meanEndpoint = {
      x: getMeanSD(endpoints.map(p => p.x)).mean,
      y: getMeanSD(endpoints.map(p => p.y)).mean,
      z: getMeanSD(endpoints.map(p => p.z)).mean,
    };
    const endpointDistances = endpoints.map(p => getDistance3D(p, meanEndpoint));
    const endpointSD = getMeanSD(endpointDistances).sd;
    const meanPathRMSD = getMeanSD(pathRMSD_list).mean;
    const timeStats = getMeanSD(movementTimes);
    const timeCV = (timeStats.mean === 0) ? NaN : (timeStats.sd / timeStats.mean) * 100;
    return { endpointSD: endpointSD, pathRMSD: meanPathRMSD, timeCV: timeCV, trialCount: trials.length };
  }
  
  
  /** * 應用帶通濾波器 (使用 Fili, 保持不變) */
  function applyBandpass(data, fs, fLow, fHigh) {
    if (typeof Fili === 'undefined') throw new Error('Fili library is not loaded.');
    const fili = new Fili();
    const butterworth = fili.butterworth({ order: 5, characteristic: 'bandpass', Fs: fs, Fc: (fLow + fHigh) / 2, BW: fHigh - fLow });
    return butterworth.multiStep(data);
  }
  
  /** * 震顫計算 (已修改為使用 dsp.js) */
  function calculateTremorMetrics(filtX, filtY, filtZ, fs) {
    // --- 檢查 DSP ---
    if (typeof DSP === 'undefined') {
      throw new Error('dsp.js library is not loaded.');
    }
    // --- 檢查結束 ---
  
    // 1. 震顫振幅 (保持不變)
    const tremorMagnitude = filtX.map((val, i) => Math.sqrt(val**2 + filtY[i]**2 + filtZ[i]**2));
    if (tremorMagnitude.length === 0) {
       return { peakFrequency: NaN, tremorAmplitude: NaN, tremorPower: NaN }; // 沒有數據無法計算
    }
    const rmsSum = tremorMagnitude.reduce((acc, val) => acc + val**2, 0);
    const tremorAmplitude = Math.sqrt(rmsSum / tremorMagnitude.length);
    const tremorAmplitudeCm = tremorAmplitude * 100;
  
    // 2. 主頻率 (使用 dsp.js 的 FFT)
    const bufferSize = 1024; // FFT size (power of 2)
    const fft = new DSP.FFT(bufferSize, fs); // <-- 建立 dsp.js FFT 實例
  
    // 準備輸入數據
    const inputBuffer = tremorMagnitude.slice(0, bufferSize);
     // 如果 inputBuffer 長度小於 bufferSize，dsp.js 會自動補零
    
    fft.forward(inputBuffer); // <-- 執行 FFT
    const spectrum = fft.spectrum; // <-- 取得頻譜 (幅度)
  
    let maxMagnitude = -Infinity;
    let peakIndex = -1;
  
    // 尋找 3-12 Hz 範圍內的峰值
    const fLowIndex = Math.max(1, Math.floor(3 * bufferSize / fs)); // 忽略直流
    const fHighIndex = Math.min(bufferSize / 2, Math.ceil(12 * bufferSize / fs));
  
    // 確保索引範圍有效
    if(fLowIndex >= spectrum.length || fHighIndex < 0) {
        console.warn("Frequency range for FFT analysis is invalid or out of bounds.");
        return { peakFrequency: NaN, tremorAmplitude: tremorAmplitudeCm, tremorPower: NaN };
    }
  
    for (let i = fLowIndex; i <= Math.min(fHighIndex, spectrum.length - 1); i++) {
      if (spectrum[i] > maxMagnitude) {
        maxMagnitude = spectrum[i];
        peakIndex = i;
      }
    }
    
    const peakFrequency = (peakIndex !== -1) ? (peakIndex * fs) / bufferSize : NaN;
    const peakPower = (maxMagnitude !== -Infinity) ? maxMagnitude**2 : -Infinity; // 功率是幅度的平方
  
    return {
      peakFrequency: peakFrequency,
      tremorAmplitude: tremorAmplitudeCm,
      tremorPower: peakPower,
    };
  }
  
  
  // --- 數學工具函數 (保持不變, 稍微加強健壯性) ---
  function getMeanSD(data) {
    const n = data.length;
    if (n === 0) return { mean: NaN, sd: NaN }; // 返回 NaN 而不是 0
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    if (n === 1) return { mean: mean, sd: 0 }; // 單點數據標準差為 0
    // 樣本標準差 (N-1)
    const variance = data.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    return { mean, sd };
  }
  function getDistance3D(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
  }
  function getPerpendicularDistance(p, a, b) {
    const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const magAB2 = ab.x**2 + ab.y**2 + ab.z**2;
    // 防止除以零，如果起點終點重合，距離就是點到起點的距離
    if (magAB2 < 1e-12) return getDistance3D(p, a);
    const dot = ap.x * ab.x + ap.y * ab.y + ap.z * ab.z;
    // 將投影點限制在線段 AB 之間
    const t = Math.max(0, Math.min(1, dot / magAB2));
    const projection = { x: a.x + t * ab.x, y: a.y + t * ab.y, z: a.z + t * ab.z };
    return getDistance3D(p, projection);
  }