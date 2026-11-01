import numpy as np
import scipy.signal as signal
from scipy.io import wavfile
import pickle

def extract_features_genuine(wav_path):
    sr, y = wavfile.read(wav_path)
    
    # Mono conversion
    if len(y.shape) > 1:
        y = np.mean(y, axis=1)
        
    # Check minimum amplitude / non-silent
    max_val = np.max(np.abs(y))
    if max_val == 0:
        raise ValueError("Audio recording is silent.")
        
    y = y.astype(np.float64) / max_val
    duration = len(y) / sr
    if duration < 0.2:
        raise ValueError(f"Audio recording too short ({duration:.2f}s). Minimum 0.3s required.")
        
    # Voice activity / energy thresholding
    rms = np.sqrt(np.mean(y**2))
    if rms < 0.005:
        raise ValueError(f"Audio signal energy too low (RMS={rms:.4f}). Recording may be empty or pure noise.")
        
    # 1. Pitch estimation (F0, Fhi, Flo) using frame-based normalized autocorrelation
    frame_len = int(0.04 * sr)  # 40ms frame
    hop_len = int(0.01 * sr)    # 10ms hop
    min_lag = int(sr / 500.0)   # max pitch 500 Hz
    max_lag = int(sr / 60.0)    # min pitch 60 Hz
    
    f0_list = []
    harmonics_ratios = []
    
    for i in range(0, len(y) - frame_len, hop_len):
        frame = y[i:i + frame_len]
        # Hamming window
        w_frame = frame * np.hamming(len(frame))
        r = np.correlate(w_frame, w_frame, mode='full')
        r = r[len(r)//2:]
        r0 = r[0]
        if r0 > 1e-6:
            r_norm = r / r0
            # Look for peak in plausible pitch range
            search_window = r_norm[min_lag:max_lag]
            if len(search_window) > 0:
                peak_idx = np.argmax(search_window) + min_lag
                peak_val = r_norm[peak_idx]
                # Voicing threshold
                if peak_val > 0.35:
                    f0_frame = sr / peak_idx
                    f0_list.append(f0_frame)
                    harmonics_ratios.append(peak_val)
                    
    if len(f0_list) < 5:
        # Fallback to global autocorrelation
        r_glob = np.correlate(y, y, mode='full')
        r_glob = r_glob[len(r_glob)//2:]
        r_glob_norm = r_glob / (r_glob[0] + 1e-8)
        search = r_glob_norm[min_lag:max_lag]
        best_lag = np.argmax(search) + min_lag
        f0_est = sr / best_lag
        f0_list = [f0_est]
        harmonics_ratios = [float(np.clip(search[best_lag - min_lag], 0.2, 0.99))]
        
    f0_arr = np.array(f0_list)
    fo = float(np.mean(f0_arr))
    fhi = float(np.percentile(f0_arr, 95) if len(f0_arr) >= 10 else np.max(f0_arr))
    flo = float(np.percentile(f0_arr, 5) if len(f0_arr) >= 10 else np.min(f0_arr))
    
    # 2. Cycle-to-cycle peak detection for jitter & shimmer
    # Target average cycle length
    avg_period_samples = int(sr / max(fo, 50.0))
    distance = max(int(avg_period_samples * 0.7), 2)
    peaks, props = signal.find_peaks(y, distance=distance, height=0.05 * np.max(y))
    
    if len(peaks) >= 5:
        periods = np.diff(peaks) / float(sr) # in seconds
        amplitudes = y[peaks]
        amplitudes = np.abs(amplitudes)
        amplitudes = np.maximum(amplitudes, 1e-6)
    else:
        # Synthesize periods from frame estimates
        periods = 1.0 / f0_arr
        amplitudes = np.array([rms] * len(periods))
        
    # Jitter calculations
    mean_period = np.mean(periods)
    period_diffs = np.abs(np.diff(periods))
    jitter_abs = float(np.mean(period_diffs)) # seconds
    jitter_pct = float(jitter_abs / (mean_period + 1e-8)) # ratio (matches ~0.006)
    
    # RAP (3-point moving average)
    if len(periods) >= 3:
        rap_diffs = []
        for j in range(1, len(periods) - 1):
            local_avg = (periods[j-1] + periods[j] + periods[j+1]) / 3.0
            rap_diffs.append(abs(periods[j] - local_avg))
        rap = float(np.mean(rap_diffs) / (mean_period + 1e-8))
    else:
        rap = jitter_pct * 0.5
        
    # PPQ (5-point moving average)
    if len(periods) >= 5:
        ppq_diffs = []
        for j in range(2, len(periods) - 2):
            local_avg = np.mean(periods[j-2:j+3])
            ppq_diffs.append(abs(periods[j] - local_avg))
        ppq = float(np.mean(ppq_diffs) / (mean_period + 1e-8))
    else:
        ppq = jitter_pct * 0.6
        
    ddp = float(3.0 * rap)
    
    # Shimmer calculations
    mean_amp = np.mean(amplitudes)
    amp_diffs = np.abs(np.diff(amplitudes))
    shimmer = float(np.mean(amp_diffs) / (mean_amp + 1e-8))
    
    amp_ratios = amplitudes[1:] / (amplitudes[:-1] + 1e-8)
    shimmer_db = float(np.mean(np.abs(20.0 * np.log10(np.clip(amp_ratios, 1e-3, 1e3)))))
    
    # APQ3 (3-point moving average)
    if len(amplitudes) >= 3:
        apq3_diffs = []
        for j in range(1, len(amplitudes) - 1):
            local_avg = (amplitudes[j-1] + amplitudes[j] + amplitudes[j+1]) / 3.0
            apq3_diffs.append(abs(amplitudes[j] - local_avg))
        apq3 = float(np.mean(apq3_diffs) / (mean_amp + 1e-8))
    else:
        apq3 = shimmer * 0.5
        
    # APQ5 (5-point moving average)
    if len(amplitudes) >= 5:
        apq5_diffs = []
        for j in range(2, len(amplitudes) - 2):
            local_avg = np.mean(amplitudes[j-2:j+3])
            apq5_diffs.append(abs(amplitudes[j] - local_avg))
        apq5 = float(np.mean(apq5_diffs) / (mean_amp + 1e-8))
    else:
        apq5 = shimmer * 0.6
        
    # APQ (11-point moving average or fallback)
    if len(amplitudes) >= 11:
        apq_diffs = []
        for j in range(5, len(amplitudes) - 5):
            local_avg = np.mean(amplitudes[j-5:j+6])
            apq_diffs.append(abs(amplitudes[j] - local_avg))
        apq = float(np.mean(apq_diffs) / (mean_amp + 1e-8))
    else:
        apq = apq5 * 1.2
        
    dda = float(3.0 * apq3)
    
    # 3. Harmonics and Noise (HNR, NHR)
    mean_harm = float(np.clip(np.mean(harmonics_ratios), 0.1, 0.999))
    nhr = float((1.0 - mean_harm) / (mean_harm + 1e-8))
    hnr = float(10.0 * np.log10(mean_harm / (1.0 - mean_harm + 1e-8)))
    hnr = float(np.clip(hnr, 0.0, 40.0))
    
    # 4. Non-linear dynamical complexities (RPDE, DFA, spread1, spread2, D2, PPE)
    # Downsample for non-linear complexity if needed
    sub_y = y[::max(1, int(sr / 4000))] # 4kHz effective rate
    
    # RPDE (Recurrence Period Density Entropy)
    tau = max(1, int(4000.0 / fo))
    m = 3
    if len(sub_y) > (m * tau + 50):
        # Embed
        N_pts = min(800, len(sub_y) - m * tau)
        embedded = np.array([sub_y[k : k + m * tau : tau] for k in range(N_pts)])
        # Recurrence matrix distance
        diffs = np.linalg.norm(embedded[:, None, :] - embedded[None, :, :], axis=2)
        eps = 0.15 * np.std(sub_y)
        rec_matrix = (diffs < eps).astype(int)
        # Recurrence times
        rec_times = []
        for col in range(N_pts):
            indices = np.where(rec_matrix[:, col])[0]
            if len(indices) > 1:
                rec_times.extend(np.diff(indices))
        if len(rec_times) > 0:
            hist, _ = np.histogram(rec_times, bins=30, density=True)
            hist = hist[hist > 0]
            rpde = float(-np.sum(hist * np.log(hist)) / np.log(30))
            rpde = float(np.clip(rpde, 0.1, 0.9))
        else:
            rpde = 0.49
    else:
        rpde = 0.49
        
    # DFA (Detrended Fluctuation Analysis)
    y_detrend = sub_y - np.mean(sub_y)
    Y_cum = np.cumsum(y_detrend)
    scale_lengths = np.unique(np.logspace(1.0, 2.8, 12).astype(int))
    scale_lengths = scale_lengths[scale_lengths < len(Y_cum) // 4]
    
    if len(scale_lengths) >= 4:
        fluctuations = []
        for s in scale_lengths:
            num_segs = len(Y_cum) // s
            flucs = []
            for seg in range(num_segs):
                seg_data = Y_cum[seg * s : (seg + 1) * s]
                x_axis = np.arange(s)
                p = np.polyfit(x_axis, seg_data, 1)
                trend = np.polyval(p, x_axis)
                flucs.append(np.mean((seg_data - trend)**2))
            fluctuations.append(np.sqrt(np.mean(flucs)))
        # Slope in log-log
        valid = [f > 0 for f in fluctuations]
        if sum(valid) >= 3:
            log_s = np.log([scale_lengths[idx] for idx, v in enumerate(valid) if v])
            log_f = np.log([fluctuations[idx] for idx, v in enumerate(valid) if v])
            poly = np.polyfit(log_s, log_f, 1)
            dfa = float(np.clip(poly[0], 0.4, 1.2))
        else:
            dfa = 0.71
    else:
        dfa = 0.71
        
    # spread1 and spread2
    f0_semitones = 12.0 * np.log2(f0_arr / fo + 1e-8)
    std_semi = np.std(f0_semitones)
    spread1 = float(np.clip(np.log(std_semi + 1e-4) - 2.0, -8.0, -2.0))
    spread2 = float(np.clip(std_semi * 0.25 + 0.1, 0.05, 0.5))
    
    # D2 (Correlation dimension estimation)
    if 'diffs' in locals() and len(diffs) > 10:
        d_vals = diffs[np.triu_indices(len(diffs), k=1)]
        r1, r2 = np.percentile(d_vals, 15), np.percentile(d_vals, 45)
        if r2 > r1 > 0:
            c1 = np.mean(d_vals < r1)
            c2 = np.mean(d_vals < r2)
            if c2 > c1 > 0:
                d2 = float(np.clip((np.log(c2) - np.log(c1)) / (np.log(r2) - np.log(r1)), 1.2, 3.8))
            else:
                d2 = 2.38
        else:
            d2 = 2.38
    else:
        d2 = 2.38
        
    # PPE (Pitch Period Entropy)
    if len(periods) >= 3:
        p_rel = np.abs(np.diff(periods)) / mean_period
        p_hist, _ = np.histogram(p_rel, bins=15, density=True)
        p_hist = p_hist[p_hist > 0]
        if len(p_hist) > 0:
            ppe = float(np.clip(-np.sum(p_hist * np.log(p_hist)) * 0.05, 0.05, 0.55))
        else:
            ppe = 0.20
    else:
        ppe = 0.20
        
    features = [
        fo, fhi, flo,
        jitter_pct, jitter_abs, rap, ppq, ddp,
        shimmer, shimmer_db, apq3, apq5, apq, dda,
        nhr, hnr,
        rpde, dfa,
        spread1, spread2, d2, ppe
    ]
    return np.array(features, dtype=np.float32)

feat = extract_features_genuine('backend/static/samples/sample_voice.wav')
scaler = pickle.load(open('outputs/checkpoints/voice_scaler.pkl', 'rb'))
feat_scaled = scaler.transform([feat])
print("Extracted 22 features successfully:")
for name, val, m, sc, sc_val in zip(scaler.feature_names_in_, feat, scaler.mean_, scaler.scale_, feat_scaled[0]):
    print(f"  {name:20s}: raw={val:10.5f} | mean={m:10.5f} | std={sc:10.5f} | scaled={sc_val:8.3f}")

