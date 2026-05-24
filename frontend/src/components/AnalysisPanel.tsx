import {useMemo} from 'react';
import {motion} from 'framer-motion';
import RadarChart from './RadarChart';
import ScoreProgressBar from './ScoreProgressBar';
import {formatDateTime} from '../utils/date';
import {AlertCircle, CheckCircle2, Clock, Download, Loader2, RefreshCw, Target, TrendingUp,} from 'lucide-react';
import type {AnalyzeStatus} from '../api/history';

interface AnalysisPanelProps {
  analysis: any;
  analyzeStatus?: AnalyzeStatus;
  analyzeError?: string;
  onExport: () => void;
  exporting: boolean;
  onReanalyze?: () => void;
  reanalyzing?: boolean;
}

/**
 * 简历分析面板组件
 */
export default function AnalysisPanel({
  analysis,
  analyzeStatus,
  analyzeError,
  onExport,
  exporting,
  onReanalyze,
  reanalyzing,
}: AnalysisPanelProps) {
  // 准备雷达图数据
  const radarData = useMemo(() => {
    if (!analysis) return [];

    const projectScore = analysis.projectScore || 0;
    const skillMatchScore = analysis.skillMatchScore || 0;
    const contentScore = analysis.contentScore || 0;
    const structureScore = analysis.structureScore || 0;
    const expressionScore = analysis.expressionScore || 0;

    const projectFullMark = 40;
    const skillMatchFullMark = 20;
    const contentFullMark = 15;
    const structureFullMark = 15;
    const expressionFullMark = 10;

    return [
      {
        subject: '表达专业性',
        score: expressionScore,
        fullMark: expressionFullMark
      },
      {
        subject: '技能匹配',
        score: skillMatchScore,
        fullMark: skillMatchFullMark
      },
      {
        subject: '内容完整性',
        score: contentScore,
        fullMark: contentFullMark
      },
      {
        subject: '结构清晰度',
        score: structureScore,
        fullMark: structureFullMark
      },
      {
        subject: '项目经验',
        score: projectScore,
        fullMark: projectFullMark
      }
    ];
  }, [analysis]);

  // 按优先级分类建议
  const suggestionsByPriority = useMemo(() => {
    if (!analysis?.suggestions) return { high: [], medium: [], low: [] };

    const suggestions = analysis.suggestions;
    return {
      high: suggestions.filter((s: any) => s.priority === '高'),
      medium: suggestions.filter((s: any) => s.priority === '中'),
      low: suggestions.filter((s: any) => s.priority === '低')
    };
  }, [analysis]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] border-[var(--color-error-subtle)] dark:border-[var(--color-error-dark)] text-[var(--color-error)] dark:text-[var(--color-error-dark)]';
      case '中':
        return 'bg-[var(--color-priority-medium-subtle)] dark:bg-[var(--color-priority-medium-subtle-dark)] border-[var(--color-priority-medium-subtle)] dark:border-[var(--color-priority-medium-subtle-dark)] text-[var(--color-priority-medium-text)] dark:text-[var(--color-warning)]';
      case '低':
        return 'bg-[var(--color-priority-low-subtle)] dark:bg-[var(--color-priority-low-subtle-dark)] border-[var(--color-priority-low-subtle)] dark:border-[var(--color-priority-low-subtle-dark)] text-[var(--color-priority-low-text)] dark:text-[var(--color-info)]';
      default:
        return 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'bg-[var(--color-error)] text-white';
      case '中':
        return 'bg-[var(--color-warning)] text-white';
      case '低':
        return 'bg-[var(--color-info)] text-white';
      default:
        return 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-white';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '项目': 'bg-[var(--color-category-project-subtle)] dark:bg-[var(--color-category-project-subtle-dark)] text-[var(--color-category-project-text)] dark:text-[var(--color-category-project-text)]',
      '技能': 'bg-[var(--color-category-skill-subtle)] dark:bg-[var(--color-category-skill-subtle-dark)] text-[var(--color-category-skill-text)] dark:text-[var(--color-category-skill-text)]',
      '内容': 'bg-[var(--color-success-subtle)] dark:bg-[var(--color-success-subtle-dark)] text-[var(--color-success)] dark:text-[var(--color-success)]',
      '格式': 'bg-[var(--color-category-format-subtle)] dark:bg-[var(--color-category-format-subtle-dark)] text-[var(--color-category-format-text)] dark:text-[var(--color-category-format-text)]',
      '结构': 'bg-[var(--color-category-structure-subtle)] dark:bg-[var(--color-category-structure-subtle-dark)] text-[var(--color-category-structure-text)] dark:text-[var(--color-category-structure-text)]',
      '表达': 'bg-[var(--color-category-expression-subtle)] dark:bg-[var(--color-category-expression-subtle-dark)] text-[var(--color-category-expression-text)] dark:text-[var(--color-category-expression-text)]'
    };
    return colors[category] || 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]';
  };

  // 检测分析结果是否有效
  const hasErrorKeywords = analysis?.summary && (
    analysis.summary.includes('I/O error') ||
    analysis.summary.includes('分析过程中出现错误') ||
    analysis.summary.includes('简历分析失败') ||
    analysis.summary.includes('Remote host terminated') ||
    analysis.summary.includes('handshake')
  );
  const isAnalysisValid = analysis &&
    analysis.overallScore >= 10 &&
    analysis.summary &&
    !hasErrorKeywords;

  // 判断是否为"分析中"状态
  const isProcessing = analyzeStatus === 'PENDING' ||
    analyzeStatus === 'PROCESSING' ||
    (analyzeStatus === undefined && !analysis);

  // 处理分析中状态
  if (isProcessing) {
    const isExplicitProcessing = analyzeStatus === 'PROCESSING';
    return (
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-12 text-center">
          <div
              className="w-16 h-16 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          {isExplicitProcessing ? (
              <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin"/>
          ) : (
              <Clock className="w-8 h-8 text-yellow-500 dark:text-yellow-400"/>
          )}
        </div>
          <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] mb-2">
          {isExplicitProcessing ? 'AI 正在分析中...' : '等待分析'}
        </h3>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-4">
          {isExplicitProcessing
            ? '请稍候，AI 正在对您的简历进行深度分析'
            : '简历已上传成功，即将开始 AI 分析'}
        </p>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">页面将自动刷新显示分析结果</p>
      </div>
    );
  }

  // 处理分析失败状态
  if (analyzeStatus === 'FAILED' || !isAnalysisValid) {
    return (
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-12 text-center">
          <div
              className="w-16 h-16 mx-auto mb-6 bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[var(--color-error)] dark:text-[var(--color-error)]"/>
        </div>
          <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] mb-2">分析失败</h3>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-4">AI 服务暂时不可用，请稍后重试</p>
        {(analyzeError || analysis?.summary) && (
            <div
                className="mt-4 p-4 bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] border border-[var(--color-error-subtle)] dark:border-[var(--color-error-dark)] rounded-lg text-left mb-4">
              <p className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-dark)]">{analyzeError || analysis.summary}</p>
          </div>
        )}
        {onReanalyze && (
          <motion.button
            onClick={onReanalyze}
            disabled={reanalyzing}
            className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
            {reanalyzing ? '重新分析中...' : '重新分析'}
          </motion.button>
        )}
      </div>
    );
  }

  const projectScore = analysis.projectScore || 0;
  const skillMatchScore = analysis.skillMatchScore || 0;
  const contentScore = analysis.contentScore || 0;
  const structureScore = analysis.structureScore || 0;
  const expressionScore = analysis.expressionScore || 0;

  return (
    <div className="space-y-6">
      {/* 核心评价和雷达图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 核心评价 */}
        <motion.div
            className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">核心评价</span>
            </div>
            <motion.button
              onClick={onExport}
              disabled={exporting}
              className="px-4 py-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm font-medium hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-all disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              {exporting ? '导出中...' : '导出分析报告'}
            </motion.button>
          </div>

          <div
              className="bg-gradient-to-br from-[var(--color-success-subtle)] dark:from-[var(--color-success-subtle-dark)] to-[var(--color-surface-dark)] rounded-xl p-6">
            <p className="text-lg text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed mb-6">
              {analysis.summary || '候选人具备扎实的技术基础，有大型项目架构经验。'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl p-5">
                <span className="text-sm font-semibold text-[var(--color-success)] dark:text-[var(--color-success)] block mb-2">总分</span>
                <span className="text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{analysis.overallScore || 0}</span>
                <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">/ 100</span>
              </div>
              <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl p-5">
                <span
                    className="text-sm font-semibold text-[var(--color-success)] dark:text-[var(--color-success)] block mb-2">分析时间</span>
                <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]">
                  {formatDateTime(analysis.analyzedAt)}
                </span>
              </div>
            </div>

            {/* 优势标签 */}
            {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl p-4">
                  <span
                      className="text-sm font-semibold text-[var(--color-success)] dark:text-[var(--color-success)] block mb-3">优势亮点</span>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s: string, i: number) => (
                      <span key={i}
                            className="px-3 py-1.5 bg-[var(--color-success-subtle)] dark:bg-[var(--color-success-subtle-dark)] text-[var(--color-success)] dark:text-[var(--color-success)] border-[var(--color-success-subtle)] rounded-lg text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 多维度评分雷达图 */}
        <motion.div
            className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-6">
            <Target className="w-5 h-5" />
            <span className="font-semibold">多维度评分</span>
          </div>

          <RadarChart data={radarData} height={320} />

          {/* 维度得分详情 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ScoreProgressBar
              label="项目经验"
              score={projectScore}
              maxScore={40}
              color="bg-purple-500"
              delay={0.3}
              className="col-span-2"
            />
            <ScoreProgressBar
              label="技能匹配"
              score={skillMatchScore}
              maxScore={20}
              color="bg-blue-500"
              delay={0.4}
            />
            <ScoreProgressBar
              label="内容完整性"
              score={contentScore}
              maxScore={15}
              color="bg-[var(--color-success)]"
              delay={0.5}
            />
            <ScoreProgressBar
              label="结构清晰度"
              score={structureScore}
              maxScore={15}
              color="bg-cyan-500"
              delay={0.6}
            />
            <ScoreProgressBar
              label="表达专业性"
              score={expressionScore}
              maxScore={10}
              color="bg-orange-500"
              delay={0.7}
            />
          </div>
        </motion.div>
      </div>

      {/* 改进建议 - 按优先级分类 */}
      <motion.div
          className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-6">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">改进建议</span>
          <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
            ({analysis.suggestions?.length || 0} 条)
          </span>
        </div>

        <div className="space-y-6">
          {/* 高优先级 */}
          {suggestionsByPriority.high.length > 0 && (
            <SuggestionSection
              priority="高"
              suggestions={suggestionsByPriority.high}
              getPriorityColor={getPriorityColor}
              getPriorityBadgeColor={getPriorityBadgeColor}
              getCategoryColor={getCategoryColor}
              delay={0.4}
            />
          )}

          {/* 中优先级 */}
          {suggestionsByPriority.medium.length > 0 && (
            <SuggestionSection
              priority="中"
              suggestions={suggestionsByPriority.medium}
              getPriorityColor={getPriorityColor}
              getPriorityBadgeColor={getPriorityBadgeColor}
              getCategoryColor={getCategoryColor}
              delay={0.5}
            />
          )}

          {/* 低优先级 */}
          {suggestionsByPriority.low.length > 0 && (
            <SuggestionSection
              priority="低"
              suggestions={suggestionsByPriority.low}
              getPriorityColor={getPriorityColor}
              getPriorityBadgeColor={getPriorityBadgeColor}
              getCategoryColor={getCategoryColor}
              delay={0.6}
            />
          )}

          {analysis.suggestions?.length === 0 && (
              <div className="text-center py-8 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">暂无改进建议</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// 建议分组组件
function SuggestionSection({
  priority,
  suggestions,
  getPriorityColor,
  getPriorityBadgeColor,
  getCategoryColor,
  delay
}: {
  priority: string;
  suggestions: any[];
  getPriorityColor: (p: string) => string;
  getPriorityBadgeColor: (p: string) => string;
  getCategoryColor: (c: string) => string;
  delay: number;
}) {
  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    '高': {
      bg: 'bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)]',
      text: 'text-[var(--color-error)] dark:text-[var(--color-error)]',
      border: 'bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)]'
    },
    '中': {
      bg: 'bg-[var(--color-priority-medium-subtle)] dark:bg-[var(--color-priority-medium-subtle-dark)]',
      text: 'text-[var(--color-priority-medium-text)] dark:text-[var(--color-warning)]',
      border: 'bg-[var(--color-priority-medium-subtle)] dark:bg-[var(--color-priority-medium-subtle-dark)]'
    },
    '低': {
      bg: 'bg-[var(--color-priority-low-subtle)] dark:bg-[var(--color-priority-low-subtle-dark)]',
      text: 'text-[var(--color-priority-low-text)] dark:text-[var(--color-info)]',
      border: 'bg-[var(--color-priority-low-subtle)] dark:bg-[var(--color-priority-low-subtle-dark)]'
    }
  };

  const colors = priorityColors[priority] || priorityColors['中'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm font-semibold`}>
          {priority}优先级 ({suggestions.length})
        </span>
        <div className={`flex-1 h-px ${colors.border}`}></div>
      </div>
      <div className="space-y-3">
        {suggestions.map((s: any, i: number) => (
            <motion.div
            key={`${priority}-${i}`}
            className={`p-4 rounded-xl border-2 ${getPriorityColor(priority)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.1 }}
          >
            <div className="flex items-start gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityBadgeColor(priority)}`}>
                {priority}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(s.category || '其他')}`}>
                {s.category || '其他'}
              </span>
            </div>
            <div className="mb-2">
              <p className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">{s.issue || '问题描述'}</p>
              <p className="text-sm leading-relaxed text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]">{s.recommendation || s}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
