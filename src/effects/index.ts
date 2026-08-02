import type { RevealEffect } from "../types/ascii";
import type { RevealEffectImpl } from "./types";
import { randomReveal } from "./randomReveal";

/**
 * エフェクトのレジストリ。
 * Phase 1 では Random のみを登録している。
 * 後続フェーズでは新しいエフェクト実装をここへ追加するだけで
 * UI・エンジン側の変更なしに切り替えられる。
 */
const effectRegistry: Partial<Record<RevealEffect, RevealEffectImpl>> = {
  random: randomReveal,
};

/** 現在利用可能なエフェクト ID の一覧。 */
export const availableEffects = Object.keys(effectRegistry) as RevealEffect[];

/**
 * 指定したエフェクト実装を取得する。
 * 未実装のエフェクトが指定された場合は Random にフォールバックする。
 */
export function getEffect(id: RevealEffect): RevealEffectImpl {
  return effectRegistry[id] ?? randomReveal;
}

export type { RevealEffectImpl, RevealContext } from "./types";
