import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiRevealEngine } from "../core/AsciiRevealEngine";
import { getEffect } from "../effects";
import type { AnimationSettings, AnimationStatus } from "../types/ascii";
import { parseAscii } from "../utils/asciiParser";

/** フレーム文字列を受け取るリスナー。 */
type FrameListener = (frame: string) => void;

export interface AsciiAnimationController {
  status: AnimationStatus;
  /** 0〜1 の進捗率。 */
  progress: number;
  /** 先頭から再生する（idle / finished / paused いずれからでも）。 */
  play: () => void;
  /** 再生中のみ一時停止する。 */
  pause: () => void;
  /** 一時停止中のみ続きから再生する。 */
  resume: () => void;
  /** 停止して開始状態（全ノイズ）へ戻す。 */
  reset: () => void;
  /**
   * 表示フレームの購読。登録時に現在のフレームを一度push する。
   * 大きな `<pre>` を React の再レンダリング対象にしないため、
   * ビューワーはこの購読経由で DOM を直接更新する。
   */
  subscribe: (listener: FrameListener) => () => void;
}

/**
 * ASCIIアートの収束アニメーションを制御するフック。
 *
 * - 描画は requestAnimationFrame + 時刻ベースの進捗率で行い、
 *   端末性能によって所要時間が変わらないようにする。
 * - 表示バッファ（大きな文字列）は購読経由で配るため、
 *   セル単位の React 再レンダリングは発生しない。
 */
export function useAsciiAnimation(
  ascii: string,
  settings: AnimationSettings,
): AsciiAnimationController {
  const [status, setStatus] = useState<AnimationStatus>("idle");
  const [progress, setProgress] = useState(0);

  const engineRef = useRef<AsciiRevealEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  // 現在の連続再生スパンの開始時刻。
  const spanStartRef = useRef(0);
  // 一時停止をまたいで累積した経過時間。
  const baseElapsedRef = useRef(0);
  const durationRef = useRef(settings.durationMs);
  const statusRef = useRef<AnimationStatus>("idle");
  const listenersRef = useRef<Set<FrameListener>>(new Set());
  const currentFrameRef = useRef("");

  durationRef.current = settings.durationMs;

  const emit = useCallback((frame: string) => {
    currentFrameRef.current = frame;
    listenersRef.current.forEach((listener) => listener(frame));
  }, []);

  const updateStatus = useCallback((next: AnimationStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(
    (now: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      const duration = Math.max(1, durationRef.current);
      const elapsed = baseElapsedRef.current + (now - spanStartRef.current);
      const p = Math.min(1, elapsed / duration);

      setProgress(p);
      emit(engine.render(p));

      if (p >= 1) {
        rafRef.current = null;
        baseElapsedRef.current = duration;
        updateStatus("finished");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [emit, updateStatus],
  );

  const play = useCallback(() => {
    if (!engineRef.current) return;
    stopRaf();
    baseElapsedRef.current = 0;
    spanStartRef.current = performance.now();
    updateStatus("playing");
    rafRef.current = requestAnimationFrame(tick);
  }, [stopRaf, tick, updateStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    stopRaf();
    baseElapsedRef.current += performance.now() - spanStartRef.current;
    updateStatus("paused");
  }, [stopRaf, updateStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    spanStartRef.current = performance.now();
    updateStatus("playing");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, updateStatus]);

  const reset = useCallback(() => {
    stopRaf();
    baseElapsedRef.current = 0;
    setProgress(0);
    updateStatus("idle");
    if (engineRef.current) {
      emit(engineRef.current.render(0));
    }
  }, [emit, stopRaf, updateStatus]);

  const subscribe = useCallback((listener: FrameListener) => {
    listenersRef.current.add(listener);
    listener(currentFrameRef.current);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // ASCII 本文・エフェクト・ノイズが変わったらエンジンを作り直し、
  // 開始状態へリセットする。所要時間(duration)の変更では作り直さない。
  useEffect(() => {
    const grid = parseAscii(ascii);
    const effect = getEffect(settings.effect);
    engineRef.current = new AsciiRevealEngine(
      grid,
      effect,
      settings.noiseCharacters,
    );
    stopRaf();
    baseElapsedRef.current = 0;
    setProgress(0);
    updateStatus("idle");
    emit(engineRef.current.render(0));
  }, [
    ascii,
    settings.effect,
    settings.noiseCharacters,
    emit,
    stopRaf,
    updateStatus,
  ]);

  // アンマウント時に rAF を止める。
  useEffect(() => stopRaf, [stopRaf]);

  return { status, progress, play, pause, resume, reset, subscribe };
}
