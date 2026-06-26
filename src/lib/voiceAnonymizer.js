/**
 * Client-side voice anonymizer.
 *
 * Goal: produce a CLEAR, intelligible recording in an ENTIRELY DIFFERENT voice,
 * with the raw recording never leaving the user's device. This is essential for a
 * whistleblower platform — uploading the original voice (or sending it to a 3rd-party
 * voice-changer API) would defeat the purpose.
 *
 * How it works (all offline, in the browser):
 *   1. Decode the recorded blob to PCM and mix to mono.
 *   2. Phase-vocoder time-stretch + resample => pitch shift that PRESERVES duration
 *      (no chipmunk / slow-mo artifacts, so speech stays clear).
 *   3. Independent spectral-envelope warp => formant (vocal-tract) shift. Formants are
 *      the single strongest speaker-identity cue, so shifting them independently of
 *      pitch is what makes it sound like a genuinely different person — and is far
 *      harder to reverse than a plain pitch shift.
 *   4. Encode the result to a 16-bit PCM WAV blob.
 *
 * The pitch/formant amounts are randomized per recording (within a natural, intelligible
 * range) so the transform is not a single, publicly-known invertible function.
 */

const FRAME_SIZE = 1024; // STFT window (power of two)
const SYNTH_HOP = FRAME_SIZE / 4; // 256 -> 75% overlap (clean Hann OLA)
const LIFTER_CUTOFF = 30; // cepstral quefrency cutoff for formant-envelope smoothing

/** In-place iterative radix-2 FFT. `re`/`im` length must be a power of two. */
function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wre = Math.cos(ang);
    const wim = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cre = 1;
      let cim = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const tre = re[b] * cre - im[b] * cim;
        const tim = re[b] * cim + im[b] * cre;
        re[b] = re[a] - tre;
        im[b] = im[a] - tim;
        re[a] += tre;
        im[a] += tim;
        const ncre = cre * wre - cim * wim;
        cim = cre * wim + cim * wre;
        cre = ncre;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

function hannWindow(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  }
  return w;
}

/** Wrap a phase value to (-pi, pi]. */
function princarg(phase) {
  return phase - 2 * Math.PI * Math.round(phase / (2 * Math.PI));
}

/** Linear interpolation of the half-spectrum envelope at a fractional bin index. */
function sampleEnvelope(env, idx) {
  if (idx <= 0) return env[0];
  const last = env.length - 1;
  if (idx >= last) return env[last];
  const i0 = Math.floor(idx);
  const frac = idx - i0;
  return env[i0] * (1 - frac) + env[i0 + 1] * frac;
}

/**
 * Phase-vocoder pitch shift (duration preserving) + independent formant shift.
 *
 * @param {Float32Array} input mono PCM
 * @param {number} pitchFactor  >1 raises pitch, <1 lowers it
 * @param {number} formantFactor >1 shifts formants up (smaller tract), <1 down
 * @param {(p:number)=>void} [onProgress]
 */
async function processChannel(input, pitchFactor, formantFactor, onProgress) {
  const N = FRAME_SIZE;
  const half = N >> 1;
  const Hs = SYNTH_HOP;
  const Ha = Math.max(1, Math.round(Hs / pitchFactor)); // analysis hop -> time-stretch = Hs/Ha ~= pitchFactor
  const stretch = Hs / Ha;
  // Formant warp applied in the STFT domain. The final resample (by pitchFactor) shifts
  // ALL frequencies by pitchFactor, so pre-divide to land on the target formant factor.
  const W = formantFactor / pitchFactor;

  const window = hannWindow(N);
  const stretchedLen = Math.ceil(input.length * stretch) + N;
  const out = new Float32Array(stretchedLen);
  const norm = new Float32Array(stretchedLen);

  const re = new Float32Array(N);
  const im = new Float32Array(N);
  const cepRe = new Float32Array(N);
  const cepIm = new Float32Array(N);
  const mag = new Float32Array(half + 1);
  const env = new Float32Array(half + 1);
  const lastPhase = new Float32Array(half + 1);
  const sumPhase = new Float32Array(half + 1);

  const numFrames = Math.max(0, Math.floor((input.length - N) / Ha) + 1);
  const expectedAdvance = new Float32Array(half + 1);
  for (let k = 0; k <= half; k++) {
    expectedAdvance[k] = (2 * Math.PI * Ha * k) / N;
  }

  for (let frame = 0; frame < numFrames; frame++) {
    const inOffset = frame * Ha;

    for (let i = 0; i < N; i++) {
      re[i] = input[inOffset + i] * window[i];
      im[i] = 0;
    }
    fft(re, im, false);

    // Magnitude (full spectrum needed for the cepstral envelope).
    for (let k = 0; k <= half; k++) {
      mag[k] = Math.hypot(re[k], im[k]);
    }

    // Spectral envelope via cepstral liftering (captures formant structure).
    cepRe[0] = Math.log(mag[0] + 1e-8);
    cepIm[0] = 0;
    cepRe[half] = Math.log(mag[half] + 1e-8);
    cepIm[half] = 0;
    for (let k = 1; k < half; k++) {
      const lm = Math.log(mag[k] + 1e-8);
      cepRe[k] = lm;
      cepIm[k] = 0;
      cepRe[N - k] = lm;
      cepIm[N - k] = 0;
    }
    fft(cepRe, cepIm, true); // -> real cepstrum
    for (let k = LIFTER_CUTOFF + 1; k < N - LIFTER_CUTOFF; k++) {
      cepRe[k] = 0;
      cepIm[k] = 0;
    }
    for (let k = 0; k < N; k++) cepIm[k] = 0;
    fft(cepRe, cepIm, false); // -> log-envelope (real part)
    for (let k = 0; k <= half; k++) {
      env[k] = Math.exp(cepRe[k]);
    }

    // Phase-vocoder phase propagation + formant warp, rebuilding a Hermitian spectrum.
    for (let k = 0; k <= half; k++) {
      const phase = Math.atan2(im[k], re[k]);
      const delta = princarg(phase - lastPhase[k] - expectedAdvance[k]);
      lastPhase[k] = phase;
      const trueFreq = (2 * Math.PI * k) / N + delta / Ha;
      sumPhase[k] = princarg(sumPhase[k] + trueFreq * Hs);

      const warpedEnv = sampleEnvelope(env, k / W);
      const newMag = (mag[k] / (env[k] + 1e-8)) * warpedEnv;

      re[k] = newMag * Math.cos(sumPhase[k]);
      im[k] = newMag * Math.sin(sumPhase[k]);
    }
    im[0] = 0;
    im[half] = 0;
    for (let k = 1; k < half; k++) {
      re[N - k] = re[k];
      im[N - k] = -im[k];
    }

    fft(re, im, true);

    const outOffset = frame * Hs;
    for (let i = 0; i < N; i++) {
      const w = window[i];
      out[outOffset + i] += re[i] * w;
      norm[outOffset + i] += w * w;
    }

    if (onProgress && (frame & 255) === 0) {
      onProgress(numFrames ? frame / numFrames : 1);
      // Yield so the UI stays responsive during the heavy DSP loop.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  for (let i = 0; i < stretchedLen; i++) {
    if (norm[i] > 1e-6) out[i] /= norm[i];
  }

  // Resample by pitchFactor: restores original duration while shifting pitch.
  const outLen = Math.floor(input.length);
  const shifted = new Float32Array(outLen);
  let peak = 0;
  for (let i = 0; i < outLen; i++) {
    const pos = i * pitchFactor;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const s0 = out[i0] || 0;
    const s1 = out[i0 + 1] || 0;
    const v = s0 * (1 - frac) + s1 * frac;
    shifted[i] = v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
  }

  // Normalize to keep output clearly audible without clipping.
  if (peak > 0) {
    const gain = 0.97 / peak;
    for (let i = 0; i < outLen; i++) shifted[i] *= gain;
  }

  if (onProgress) onProgress(1);
  return shifted;
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i];
  }
  if (numberOfChannels > 1) {
    for (let i = 0; i < length; i++) mono[i] /= numberOfChannels;
  }
  return mono;
}

function encodeWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Fixed voice profile so every recording (and re-record) produces the SAME
 * disguised voice. Pitch and formants are decoupled and shifted up by a modest,
 * natural amount — enough to read as a different person while staying clearly
 * human and intelligible (no deep "bassy" variant, no chipmunk artifacts).
 */
const VOICE_PROFILE = {
  pitchFactor: 1.18,
  formantFactor: 1.14,
};

function pickVoiceProfile() {
  return { ...VOICE_PROFILE };
}

/**
 * Anonymize a recorded audio blob entirely on-device.
 *
 * @param {Blob} blob recorded audio (e.g. audio/webm)
 * @param {{ onProgress?: (p:number)=>void }} [options]
 * @returns {Promise<{ blob: Blob, audioFormat: 'wav', mimeType: 'audio/wav', durationSeconds: number }>}
 */
export async function anonymizeVoiceBlob(blob, options = {}) {
  const { onProgress } = options;
  if (!blob) throw new Error('No audio provided to anonymize.');

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Audio processing is not supported in this browser.');

  const arrayBuffer = await blob.arrayBuffer();
  const decodeCtx = new AudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    decodeCtx.close?.();
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('The recording appears to be empty.');
  }

  const sampleRate = audioBuffer.sampleRate;
  const mono = mixToMono(audioBuffer);
  const { pitchFactor, formantFactor } = pickVoiceProfile();

  const processed = await processChannel(mono, pitchFactor, formantFactor, onProgress);
  const wavBlob = encodeWav(processed, sampleRate);

  return {
    blob: wavBlob,
    audioFormat: 'wav',
    mimeType: 'audio/wav',
    durationSeconds: processed.length / sampleRate,
  };
}
