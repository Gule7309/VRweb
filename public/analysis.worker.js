// public/analysis.worker.js

// 1. 引入必要的庫
// Web Worker 無法使用 ES6 import，我們用 importScripts
try {
    importScripts(
      "https://cdn.jsdelivr.net/npm/fili@2.0.3/dist/fili.min.js",
      "https://cdn.jsdelivr.net/npm/fft.js@4.0.4/dist/fft.min.js"
    );
  } catch (e) {
    console.error("Failed to import scripts:", e);
  }
  
  // 2. 監聽來自主應用的消息
  self.onmessage = (event) => {
    const { csvData, handType, targetSampleRate } = event.data; // e.g., handType: 'RightHand', targetSampleRate: 65
  
    if (!csvData) return;
  
    // --- 核心運算開始 ---
    try {
      // 步驟 A: 解析與分離數據
      const { time, x, y, z } = parseAndSeparate(csvData, handType);
      if (time.length < 20) { // 數據太少
        throw new Error("Data points are insufficient for analysis.");
      }
  
      // 步驟 B: 重採樣 (Resample)
      const fs = targetSampleRate;
      const { resampledTime, resampledX, resampledY, resampledZ } = resampleData(
        time, x, y, z, fs
      );
      
      // 步驟 C: 帶通濾波 (3-12 Hz)
      const filteredX = applyBandpass(resampledX, fs, 3, 12);
      const filteredY = applyBandpass(resampledY, fs, 3, 12);
      const filteredZ = applyBandpass(resampledZ, fs, 3, 12);
  
      // 步驟 D: 計算指標
      const metrics = calculateMetrics(
        filteredX, filteredY, filteredZ, 
        resampledX, resampledY, resampledZ, 
        fs
      );
  
      // 步驟 E: 回傳結果
      self.postMessage({ status: 'success', data: metrics });
  
    } catch (error) {
      self.postMessage({ status: 'error', message: error.message });
    }
  };
  
  // --- 輔助函數 ---
  
  /** * 步驟 A: 解析 CSV 並分離指定的手 
   * 假設 CSV 格式: Type,X,Y,Z,Time,...
   */
  function parseAndSeparate(csvData, handType) {
    const lines = csvData.trim().split('\n');
    const time = [], x = [], y = [], z = [];
  
    lines.slice(1).forEach(line => { // 跳過標頭
      const parts = line.split(',');
      if (parts[0] === handType) {
        x.push(parseFloat(parts[1]));
        y.push(parseFloat(parts[2]));
        z.push(parseFloat(parts[3]));
        time.push(parseFloat(parts[4])); // Time 在第 5 欄 (index 4)
      }
    });
    return { time, x, y, z };
  }
  
  /** * 步驟 B: 線性插值重採樣
   */
  function resampleData(time, x, y, z, fs) {
    const resampledTime = [], resampledX = [], resampledY = [], resampledZ = [];
    const dt = 1 / fs; // 新的時間間隔
    const startTime = time[0];
    const endTime = time[time.length - 1];
  
    let currentTime = startTime;
    let i = 1;
  
    while (currentTime <= endTime) {
      // 找到當前時間點在哪兩個原始樣本之間
      while (i < time.length && time[i] < currentTime) {
        i++;
      }
      if (i >= time.length) break; // 超出範圍
  
      // 線性插值
      const t1 = time[i - 1], t2 = time[i];
      const frac = (currentTime - t1) / (t2 - t1);
  
      const interpX = x[i - 1] + (x[i] - x[i - 1]) * frac;
      const interpY = y[i - 1] + (y[i] - y[i - 1]) * frac;
      const interpZ = z[i - 1] + (z[i] - z[i - 1]) * frac;
  
      resampledTime.push(currentTime);
      resampledX.push(interpX);
      resampledY.push(interpY);
      resampledZ.push(interpZ);
  
      currentTime += dt;
    }
    return { resampledTime, resampledX, resampledY, resampledZ };
  }
  
  /** * 步驟 C: 應用帶通濾波器
   */
  function applyBandpass(data, fs, fLow, fHigh) {
    if (typeof Fili === 'undefined') {
      throw new Error('Fili library is not loaded.');
    }
    const fili = new Fili.default();
    const filterOrder = 5;
    const centerFreq = (fLow + fHigh) / 2;
    const bandwidth = fHigh - fLow;
  
    // 創建一個 Butterworth 帶通濾波器
    const butterworth = fili.butterworth({
      order: filterOrder,
      characteristic: 'bandpass',
      Fs: fs,
      Fc: centerFreq,
      BW: bandwidth,
    });
  
    // 應用濾波器
    const filteredData = butterworth.multiStep(data);
    return filteredData;
  }
  
  /** * 步驟 D: 計算最終指標
   */
  function calculateMetrics(filtX, filtY, filtZ, rawX, rawY, rawZ, fs) {
    if (typeof Fft === 'undefined') {
      throw new Error('fft.js library is not loaded.');
    }
  
    // 1. 震顫振幅 (Tremor Amplitude)
    // 融合三軸 "震顫" 訊號 (濾波後的)
    const tremorMagnitude = filtX.map((val, i) => {
      return Math.sqrt(val**2 + filtY[i]**2 + filtZ[i]**2);
    });
    
    // 計算 RMS
    const rmsSum = tremorMagnitude.reduce((acc, val) => acc + val**2, 0);
    const tremorAmplitude = Math.sqrt(rmsSum / tremorMagnitude.length);
    // 假設單位是 'm'，轉換為 'cm'
    const tremorAmplitudeCm = tremorAmplitude * 100;
  
    // 2. 主頻率 (Peak Frequency)
    // 選擇訊號變化最大的一軸 (或融合後的) 進行 FFT
    const N = 1024; // FFT size (power of 2)，如果數據不夠長需要補零
    const fft = new Fft.default.Complex(N);
    const input = new Float64Array(N).fill(0);
    input.set(tremorMagnitude.slice(0, N)); // 使用融合後的振幅
    
    const spectrum = new Float64Array(N * 2);
    fft.transform(spectrum, input);
    
    // 計算功率譜密度 (PSD)
    const power = [];
    const fLowBin = Math.floor(3 * N / fs); // 3 Hz 對應的 bin
    const fHighBin = Math.ceil(12 * N / fs); // 12 Hz 對應的 bin
  
    let maxPower = -Infinity;
    let peakBin = -1;
  
    for (let i = fLowBin; i <= fHighBin; i++) {
      const real = spectrum[i * 2];
      const imag = spectrum[i * 2 + 1];
      const p = real**2 + imag**2;
      power[i] = p;
  
      if (p > maxPower) {
        maxPower = p;
        peakBin = i;
      }
    }
  
    const peakFrequency = (peakBin * fs) / N;
  
    // 3. 穩定性 (RMS 加速度 - 從位置推算)
    // 簡易版：使用濾波後 "速度" 的 RMS 作為穩定性指標 (速度是位置的一階微分)
    const velocities = [];
    for (let i = 1; i < filtX.length; i++) {
      const vx = (filtX[i] - filtX[i-1]) * fs;
      const vy = (filtY[i] - filtY[i-1]) * fs;
      const vz = (filtZ[i] - filtZ[i-1]) * fs;
      velocities.push(Math.sqrt(vx**2 + vy**2 + vz**2));
    }
    const rmsVelSum = velocities.reduce((acc, v) => acc + v**2, 0);
    const rmsVelocity = Math.sqrt(rmsVelSum / velocities.length);
  
    // 4. (可選) 自願運動速度 (從 <2Hz 訊號計算)
    // ... (這需要另一個低通濾波器)
  
    return {
      peakFrequency: peakFrequency,       // Hz
      tremorAmplitude: tremorAmplitudeCm, // cm
      rmsAcceleration: rmsVelocity, // 這裡用速度 RMS 替代，m/s
      tremorPower: maxPower,        // 功率譜峰值 (相對值)
    };
  }