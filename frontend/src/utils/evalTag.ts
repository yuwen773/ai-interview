/**
 * SSE 隐藏评估标签工具
 *
 * 用于在 LLM 流式回复中嵌入结构化评估数据，前端解析后剥离标签，用户不可见。
 *
 * 标签格式: <!--EVAL:{"score":8,"shouldAdvance":true,"brief":"回答很好"}-->
 *
 * 后端在生成面试回复时嵌入此标签，前端 SSE 解析器检测并提取评估数据。
 */

/** 评估标签中携带的数据结构 */
export interface EvalData {
  /** 当前回答评分 (0-10) */
  score?: number;
  /** 是否应推进到下一阶段 */
  shouldAdvance?: boolean;
  /** 简短评语 */
  brief?: string;
  /** 面试阶段 */
  phase?: string;
  /** 信心水平 (0-1) */
  confidence?: number;
}

/** 标签前缀和后缀 */
const EVAL_OPEN = '<!--EVAL:';
const EVAL_CLOSE = '-->';

/**
 * 从流式文本缓冲区中提取并剥离评估标签
 *
 * 处理三种情况:
 * 1. 完整标签在缓冲区内 → 提取评估数据，返回清理后的文本
 * 2. 标签跨 chunk 边界（部分标签在末尾）→ 保留可能的前缀，返回安全文本
 * 3. 无标签 → 原样返回
 */
export function extractEvalTags(buffer: string): {
  text: string;
  evals: EvalData[];
  pending: string;
} {
  const evals: EvalData[] = [];
  let text = buffer;
  let pending = '';

  // 反复提取完整标签
  let searchStart = 0;
  while (true) {
    const openIdx = text.indexOf(EVAL_OPEN, searchStart);
    if (openIdx === -1) break;

    const closeIdx = text.indexOf(EVAL_CLOSE, openIdx + EVAL_OPEN.length);
    if (closeIdx === -1) {
      // 标签不完整 — 可能跨 chunk，保留待处理部分
      pending = text.substring(openIdx);
      text = text.substring(0, openIdx);
      break;
    }

    // 提取 JSON 内容
    const jsonStr = text.substring(openIdx + EVAL_OPEN.length, closeIdx);
    try {
      const data = JSON.parse(jsonStr);
      evals.push(data);
    } catch {
      // JSON 解析失败，忽略此标签
    }

    // 从文本中移除标签
    text = text.substring(0, openIdx) + text.substring(closeIdx + EVAL_CLOSE.length);
    searchStart = openIdx;
  }

  return { text, evals, pending };
}

/**
 * 合并前一次的 pending 部分和新 chunk，继续提取评估标签
 */
export function processStreamChunk(
  prevPending: string,
  newChunk: string,
): { text: string; evals: EvalData[]; pending: string } {
  return extractEvalTags(prevPending + newChunk);
}

/**
 * 快速检测文本中是否包含完整的评估标签（不解析）
 */
export function hasEvalTag(text: string): boolean {
  return text.includes(EVAL_OPEN) && text.includes(EVAL_CLOSE);
}
