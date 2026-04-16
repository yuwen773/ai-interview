import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { graphApi, type GraphData, type GraphNode } from '../api/graph';
import { profileApi, type UserProfileDto } from '../api/profile';
import { getErrorMessage } from '../api/request';

function getScoreColor(score: number): string {
  if (score >= 70) return '#34d399';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
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


  const renderEmptyState = (message: string, subtext?: string) => (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
      <GitBranch className="w-12 h-12 opacity-30" />
      <p className="text-lg font-medium">{message}</p>
      {subtext && <p className="text-sm">{subtext}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---- Header ---- */}
      <header className="flex items-center gap-4 mb-6 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
          知识图谱
        </h1>

        {/* Topic selector */}
        <div className="relative ml-4">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
          >
            <option value="">选择主题...</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <GitBranch className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
          <input
            type="text"
            placeholder="搜索题目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-56"
          />
        </div>
      </header>

      {/* ---- Body ---- */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* -- Filter Panel -- */}
        <aside className="w-56 flex-shrink-0 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-4 flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              筛选
            </h3>

            {/* Score range */}
            <label className="block text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
              分数区间: {scoreRange[0]} - {scoreRange[1]}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={scoreRange[0]}
                onChange={(e) =>
                  setScoreRange([Math.min(Number(e.target.value), scoreRange[1]), scoreRange[1]])
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div className="flex gap-2 items-center mt-1">
              <input
                type="range"
                min={0}
                max={100}
                value={scoreRange[1]}
                onChange={(e) =>
                  setScoreRange([scoreRange[0], Math.max(Number(e.target.value), scoreRange[0])])
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Weak focus */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={focusWeak}
                onChange={(e) => setFocusWeak(e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                弱项聚焦
              </span>
            </label>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1 ml-6">
              仅显示分数 &lt; 40 的节点
            </p>
          </div>

          {/* Zoom controls */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-3">
              缩放
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomFit}
                className="p-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors"
                title="适应画布"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider mb-3">
              图例
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">掌握 (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">一般 (40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">薄弱 (&lt;40)</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          {graphData && (
            <div className="mt-auto text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] space-y-1">
              <p>节点: {filteredData?.nodes.length ?? 0}</p>
              <p>连线: {filteredData?.links.length ?? 0}</p>
            </div>
          )}
        </aside>

        {/* -- Graph Canvas -- */}
        <div
          ref={containerRef}
          className="flex-1 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden relative"
        >
          {!selectedTopic ? (
            renderEmptyState('请选择一个主题', '从顶部下拉框中选择以加载知识图谱')
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => loadGraph(selectedTopic)}
                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                重试
              </button>
            </div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            renderEmptyState('该主题暂无图谱数据', '请先完成该主题的面试以生成图谱')
          ) : filteredData && filteredData.nodes.length === 0 ? (
            renderEmptyState('筛选结果为空', '请调整筛选条件后重试')
          ) : filteredData ? (
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
          ) : null}
        </div>
      </div>

      {/* ---- Node Detail Panel ---- */}
      {selectedNode && (
        <div className="mt-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: getScoreColor(selectedNode.score) }}
                />
                <h3 className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  节点详情
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                  {selectedNode.topic}
                </span>
              </div>
              <p className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm leading-relaxed mb-3">
                {selectedNode.question}
              </p>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                <span>
                  分数:{' '}
                  <strong
                    className="text-sm"
                    style={{ color: getScoreColor(selectedNode.score) }}
                  >
                    {selectedNode.score.toFixed(1)}
                  </strong>
                </span>
                <span>
                  关联节点:{' '}
                  {graphData
                    ? graphData.links.filter(
                        (l) =>
                          String(l.source) === String(selectedNode.id) ||
                          String(l.target) === String(selectedNode.id)
                      ).length
                    : 0}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded-lg hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
