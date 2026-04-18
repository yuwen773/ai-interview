import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ChevronLeft,
  GitBranch,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Target,
  X,
  Network,
  Sparkles,
} from 'lucide-react';
import { graphApi, type GraphData, type GraphNode } from '../api/graph';
import { profileApi, type UserProfileDto } from '../api/profile';
import { getErrorMessage } from '../api/request';

function getScoreColor(score: number): string {
  if (score >= 70) return '#34d399';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  if (score >= 40) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
}

function getNodeRadius(score: number): number {
  return 4 + Math.max(0, 100 - score) / 20;
}

export default function KnowledgeGraphPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [focusWeak, setFocusWeak] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setSelectedTopic(prev => prev || (data.topicMasteries.length > 0 ? data.topicMasteries[0].topic : ''));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  const loadGraph = useCallback(async (topic: string) => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setGraphData(null);
    setSelectedNode(null);
    try {
      const data = await graphApi.getGraph(topic);
      setGraphData(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (selectedTopic) loadGraph(selectedTopic);
  }, [selectedTopic, loadGraph]);

  const filteredData = useMemo(() => {
    if (!graphData) return null;

    const nodeIds = new Set<string>();

    const filteredNodes = graphData.nodes.filter((n) => {
      const inRange = n.score >= scoreRange[0] && n.score <= scoreRange[1];
      const isWeak = focusWeak ? n.score < 40 : true;
      const matchesSearch =
        !searchQuery ||
        n.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.topic.toLowerCase().includes(searchQuery.toLowerCase());
      if (inRange && isWeak && matchesSearch) {
        nodeIds.add(String(n.id));
        return true;
      }
      return false;
    });

    const filteredLinks = graphData.links.filter(
      (l) => nodeIds.has(String(l.source)) && nodeIds.has(String(l.target))
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, scoreRange, focusWeak, searchQuery]);

  const neighborIds = useMemo(() => {
    if (!selectedNode || !graphData) return new Set<string>();
    const ids = new Set<string>();
    ids.add(String(selectedNode.id));
    for (const link of graphData.links) {
      const s = String(link.source);
      const t = String(link.target);
      if (s === String(selectedNode.id)) ids.add(t);
      if (t === String(selectedNode.id)) ids.add(s);
    }
    return ids;
  }, [selectedNode, graphData]);

  const topics = useMemo(() => {
    if (!profile) return [];
    return profile.topicMasteries.map((m) => m.topic);
  }, [profile]);

  const handleZoomIn = () => {
    const fg = fgRef.current;
    if (!fg) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fg as any).zoom((fg as any).zoom() * 1.3, 300);
  };
  const handleZoomOut = () => {
    const fg = fgRef.current;
    if (!fg) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fg as any).zoom((fg as any).zoom() / 1.3, 300);
  };
  const handleZoomFit = () => {
    const fg = fgRef.current;
    if (!fg) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fg as any).zoomToFit(400, 40);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const id = String(node.id);
      const score: number = node.score ?? 50;
      const color = getScoreColor(score);
      const radius = getNodeRadius(score);

      const isSelected = selectedNode && String(selectedNode.id) === id;
      const isNeighbor = neighborIds.has(id);
      const isDimmed = selectedNode && !isNeighbor;
      const isHovered = hoverNode && String(hoverNode.id) === id;

      const alpha = isDimmed ? 0.2 : 1;
      const drawRadius = isHovered ? radius * 1.4 : isSelected ? radius * 1.2 : radius;

      // Glow for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, drawRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', ',0.25)').replace('rgb', 'rgba').replace('#', '');
        // simple approach: use a radial gradient
        const grad = ctx.createRadialGradient(
          node.x!,
          node.y!,
          drawRadius,
          node.x!,
          node.y!,
          drawRadius + 6
        );
        grad.addColorStop(0, color + '60');
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Node circle
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, drawRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // White border for selected/hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Label when zoomed in enough
      if (globalScale > 1.2 || isSelected || isHovered) {
        const label = node.question
          ? node.question.length > 30
            ? node.question.substring(0, 30) + '...'
            : node.question
          : id;
        ctx.font = `${Math.max(10 / globalScale, 3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = isDimmed ? '#99999980' : '#ffffff';
        ctx.fillText(label, node.x!, node.y! - drawRadius - 2);
      }

      ctx.globalAlpha = 1;
    },
    [selectedNode, neighborIds, hoverNode]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, _globalScale: number) => {
      const srcId = String((link.source as { id?: string | number }).id ?? link.source);
      const tgtId = String((link.target as { id?: string | number }).id ?? link.target);

      const isNeighbor =
        (selectedNode && neighborIds.has(srcId) && neighborIds.has(tgtId)) ?? false;
      const isDimmed = selectedNode && !isNeighbor;

      const similarity: number = link.similarity ?? 0.5;
      ctx.globalAlpha = isDimmed ? 0.05 : similarity * 0.6;
      ctx.strokeStyle = isDimmed ? '#666666' : '#aaaaaa';
      ctx.lineWidth = isDimmed ? 0.5 : Math.max(0.5, similarity * 2);

      ctx.beginPath();
      ctx.moveTo(
        (link.source as { x?: number }).x ?? 0,
        (link.source as { y?: number }).y ?? 0
      );
      ctx.lineTo(
        (link.target as { x?: number }).x ?? 0,
        (link.target as { y?: number }).y ?? 0
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    [selectedNode, neighborIds]
  );


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const renderEmptyState = (message: string, subtext?: string, icon?: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="flex flex-col items-center justify-center h-full gap-4"
    >
      {icon && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] opacity-40"
        >
          {icon}
        </motion.div>
      )}
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{message}</p>
        {subtext && (
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1.5">{subtext}</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen flex flex-col"
    >
      {/* ---- Header ---- */}
      <motion.header
        variants={itemVariants}
        className="flex items-center gap-4 mb-6 flex-shrink-0"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-text-dark)] transition-colors" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-md">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight">
              知识图谱
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">可视化知识点关联网络</p>
          </div>
        </div>

        {/* Topic selector */}
        <div className="relative ml-6">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer transition-all hover:border-[var(--color-primary)]"
          >
            <option value="">选择主题...</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <GitBranch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
          <input
            type="text"
            placeholder="搜索题目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-64 transition-all"
          />
        </div>
      </motion.header>

      {/* ---- Body ---- */}
      <motion.div
        variants={itemVariants}
        className="flex flex-1 gap-4 min-h-0"
      >
        {/* -- Filter Panel -- */}
        <aside className="w-60 flex-shrink-0 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-5 flex flex-col gap-6 shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              筛选条件
            </h3>

            {/* Score range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">分数区间</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                  {scoreRange[0]} - {scoreRange[1]}
                </span>
              </div>
              <div className="relative pt-1">
                {/* Range slider track */}
                <div className="relative h-1.5 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full">
                  {/* Active range */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-full"
                    style={{
                      left: `${scoreRange[0]}%`,
                      width: `${scoreRange[1] - scoreRange[0]}%`,
                    }}
                  />
                </div>
                {/* Min slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scoreRange[0]}
                  onChange={(e) =>
                    setScoreRange([Math.min(Number(e.target.value), scoreRange[1]), scoreRange[1]])
                  }
                  className="absolute top-0 w-full h-1.5 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
                {/* Max slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scoreRange[1]}
                  onChange={(e) =>
                    setScoreRange([scoreRange[0], Math.max(Number(e.target.value), scoreRange[0])])
                  }
                  className="absolute top-0 w-full h-1.5 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>
            </div>
          </div>

          {/* Weak focus */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-transparent border border-red-100 dark:border-red-900/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <motion.div
                className={`w-10 h-6 rounded-full p-0.5 transition-colors ${focusWeak ? 'bg-red-400' : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ x: focusWeak ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.div>
              <input
                type="checkbox"
                checked={focusWeak}
                onChange={(e) => setFocusWeak(e.target.checked)}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  弱项聚焦
                </span>
              </div>
            </label>
            <p className="text-xs text-red-600 dark:text-red-400/70 mt-2 ml-13">
              仅显示分数 &lt; 40 的节点
            </p>
          </div>

          {/* Zoom controls */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-3">
              画布控制
            </h3>
            <div className="flex gap-2">
              {[
                { icon: ZoomIn, label: '放大', action: handleZoomIn },
                { icon: ZoomOut, label: '缩小', action: handleZoomOut },
                { icon: Maximize2, label: '适应画布', action: handleZoomFit },
              ].map(({ icon: Icon, label, action }) => (
                <motion.button
                  key={label}
                  onClick={action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 p-2.5 rounded-xl bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors flex items-center justify-center group"
                  title={label}
                >
                  <Icon className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-text-dark)] transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-3">
              节点图例
            </h3>
            <div className="space-y-2.5">
              {[
                { color: 'bg-emerald-400', label: '掌握', range: '70+', shadow: 'shadow-emerald-400/50' },
                { color: 'bg-amber-400', label: '一般', range: '40-69', shadow: 'shadow-amber-400/50' },
                { color: 'bg-red-400', label: '薄弱', range: '<40', shadow: 'shadow-red-400/50' },
              ].map(({ color, label, range, shadow }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className={`w-3.5 h-3.5 rounded-full ${color} shadow-md ${shadow}`}
                      whileHover={{ scale: 1.3 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    />
                    <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{label}</span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">({range})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {graphData && (
            <div className="mt-auto pt-4 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2.5 rounded-xl bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
                  <div className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                    {filteredData?.nodes.length ?? 0}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">节点</div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
                  <div className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                    {filteredData?.links.length ?? 0}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">连线</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* -- Graph Canvas -- */}
        <div
          ref={containerRef}
          className="flex-1 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden relative shadow-sm"
        >
          {/* Decorative background grid */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(var(--color-border) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          <AnimatePresence mode="wait">
            {!selectedTopic ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {renderEmptyState(
                  '请选择一个主题',
                  '从顶部下拉框中选择以加载知识图谱',
                  <Sparkles className="w-16 h-16" />
                )}
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    className="w-12 h-12 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">正在加载图谱数据...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                  <motion.button
                    onClick={() => loadGraph(selectedTopic)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-sm bg-[var(--color-primary)] text-white rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors shadow-md"
                  >
                    重试
                  </motion.button>
                </div>
              </motion.div>
            ) : !graphData || graphData.nodes.length === 0 ? (
              <motion.div
                key="no-data"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0"
              >
                {renderEmptyState(
                  '该主题暂无图谱数据',
                  '请先完成该主题的面试以生成图谱',
                  <Network className="w-16 h-16" />
                )}
              </motion.div>
            ) : filteredData && filteredData.nodes.length === 0 ? (
              <motion.div
                key="filtered-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0"
              >
                {renderEmptyState(
                  '筛选结果为空',
                  '请调整筛选条件后重试',
                  <Filter className="w-16 h-16" />
                )}
              </motion.div>
            ) : filteredData ? (
              <motion.div
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ForceGraph2D
                  ref={fgRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={filteredData}
                  nodeId="id"
                  linkSource="source"
                  linkTarget="target"
                  nodeCanvasObject={paintNode}
                  nodePointerAreaPaint={(node, color, ctx, _globalScale) => {
                    const radius = getNodeRadius(node.score ?? 50) * 1.5;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
                    ctx.fill();
                  }}
                  linkCanvasObject={paintLink}
                  linkDirectionalArrowLength={0}
                  onNodeClick={(node) => {
                    if (selectedNode && String(selectedNode.id) === String(node.id)) {
                      setSelectedNode(null);
                    } else {
                      setSelectedNode({
                        id: String(node.id),
                        question: node.question ?? '',
                        score: node.score ?? 0,
                        topic: node.topic ?? '',
                      });
                    }
                  }}
                  onNodeHover={(node) => {
                    if (node) {
                      setHoverNode({
                        id: String(node.id),
                        question: node.question ?? '',
                        score: node.score ?? 0,
                        topic: node.topic ?? '',
                      });
                      containerRef.current?.style.setProperty('cursor', 'pointer');
                    } else {
                      setHoverNode(null);
                      containerRef.current?.style.setProperty('cursor', 'default');
                    }
                  }}
                  backgroundColor="transparent"
                  cooldownTicks={200}
                  enableNodeDrag={true}
                  enableZoomInteraction={true}
                  enablePanInteraction={true}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ---- Node Detail Panel ---- */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="mt-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-5 flex-shrink-0 shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className={`w-3 h-3 rounded-full shadow-lg`}
                    style={{ backgroundColor: getScoreColor(selectedNode.score) }}
                    whileHover={{ scale: 1.4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  />
                  <h3 className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                    节点详情
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${getScoreBadgeColor(selectedNode.score)}`}>
                    {selectedNode.topic}
                  </span>
                </div>

                <motion.p
                  className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm leading-relaxed mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {selectedNode.question}
                </motion.p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">掌握分数</span>
                    <motion.span
                      className="text-lg font-bold"
                      style={{ color: getScoreColor(selectedNode.score) }}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring' }}
                    >
                      {selectedNode.score.toFixed(1)}
                    </motion.span>
                  </div>

                  <div className="h-4 w-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">关联节点</span>
                    <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                      {graphData
                        ? graphData.links.filter(
                            (l) =>
                              String(l.source) === String(selectedNode.id) ||
                              String(l.target) === String(selectedNode.id)
                          ).length
                        : 0}
                    </span>
                  </div>

                  {/* Score bar visualization */}
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-24 h-1.5 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getScoreColor(selectedNode.score) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNode.score}%` }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => setSelectedNode(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
