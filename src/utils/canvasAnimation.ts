import type { Core } from 'cytoscape';
import type { AnimationFpsMode } from '../types';

/**
 * 帧率配置与补间时长映射表 (毫秒)
 */
export const FPS_DURATION_MAP: Record<AnimationFpsMode, number> = {
  high: 650,     // 120Hz+ 满血：长补间极致丝滑流体
  standard: 450, // 60 FPS 标准：自然跟手
  economy: 220,  // 30 FPS 节能：紧凑省电
  off: 0         // 0 FPS 极速：瞬间定格
};

/**
 * 开屏/换工程 星系绽放入场动效 (Constellation Blooming Entrance)
 * 节点自拓扑聚拢态如生命绽放般滑向目标排版坐标，消除突兀生硬的弹窗弹出感。
 */
export function animateConstellationEntrance(
  cy: Core,
  fpsMode: AnimationFpsMode = 'standard',
  onComplete?: () => void
): void {
  const nodes = cy.nodes();
  if (nodes.length === 0) {
    onComplete?.();
    return;
  }

  // 1. 记录各个节点的最终目标绝对坐标
  const targetMap = new Map<string, { x: number; y: number }>();
  nodes.forEach(node => {
    targetMap.set(node.id(), { ...node.position() });
  });

  // 2. 若用户选择 0 FPS 极速模式，直接瞬间居中显示，零等待
  if (fpsMode === 'off') {
    nodes.style('opacity', 1);
    cy.fit(nodes, 60);
    onComplete?.();
    return;
  }

  // 3. 计算拓扑图的视觉重心
  const bb = nodes.boundingBox();
  const centerX = (bb.x1 + bb.x2) / 2;
  const centerY = (bb.y1 + bb.y2) / 2;

  // 4. 将所有节点瞬移至微聚拢的初始初相态（向中心收拢 75%，微弱半透明）
  nodes.forEach(node => {
    const target = targetMap.get(node.id());
    if (!target) return;
    const dx = target.x - centerX;
    const dy = target.y - centerY;
    node.position({
      x: centerX + dx * 0.22,
      y: centerY + dy * 0.22
    });
    node.style('opacity', 0.15);
  });

  const duration = FPS_DURATION_MAP[fpsMode] ?? 450;

  // 5. 优雅绽放动画：各节点沿各自因果流向滑移至精确拓扑位置
  nodes.forEach((node, index) => {
    const target = targetMap.get(node.id());
    if (!target) return;

    // 微阶梯交错延迟（高刷档更精细，节能档全齐射）
    const staggerDelay =
      fpsMode === 'high'
        ? Math.min(index * 12, 100)
        : fpsMode === 'standard'
        ? Math.min(index * 8, 60)
        : 0;

    setTimeout(() => {
      node.animate(
        {
          position: target,
          style: { opacity: 1 }
        },
        {
          duration,
          easing: 'ease-out-cubic'
        }
      );
    }, staggerDelay);
  });

  // 6. 摄像机同步推镜居中，视野丝滑展开
  cy.animate(
    {
      fit: {
        eles: nodes,
        padding: 60
      }
    },
    {
      duration: duration + 100,
      easing: 'ease-out-cubic',
      complete: onComplete
    }
  );
}

/**
 * 重新排版弹性回弹脉冲 (Elastic Pulse on Relayout)
 * 解决节点已处于排版位置时位移为 0 导致动画完全看不出的问题。
 * 施加轻微扩散弹性脉冲（向外扩散 14% 后回弹），直观体现不同帧率档位的插值阻尼感。
 */
export function animateRelayoutPulse(
  cy: Core,
  fpsMode: AnimationFpsMode = 'standard',
  onComplete?: () => void
): void {
  const nodes = cy.nodes();
  if (nodes.length === 0) {
    onComplete?.();
    return;
  }

  // 0 FPS 极速模式：瞬移居中
  if (fpsMode === 'off') {
    cy.fit(nodes, 60);
    onComplete?.();
    return;
  }

  const targetMap = new Map<string, { x: number; y: number }>();
  nodes.forEach(n => {
    targetMap.set(n.id(), { ...n.position() });
  });

  const bb = nodes.boundingBox();
  const centerX = (bb.x1 + bb.x2) / 2;
  const centerY = (bb.y1 + bb.y2) / 2;

  const totalDuration = FPS_DURATION_MAP[fpsMode] ?? 450;
  const phase1Duration = Math.round(totalDuration * 0.38);
  const phase2Duration = Math.round(totalDuration * 0.62);

  // 第一阶段：向外轻微呼吸扩散
  nodes.forEach(node => {
    const target = targetMap.get(node.id());
    if (!target) return;
    const dx = target.x - centerX;
    const dy = target.y - centerY;

    node.animate(
      {
        position: {
          x: centerX + dx * 1.14,
          y: centerY + dy * 1.14
        }
      },
      {
        duration: phase1Duration,
        easing: 'ease-out-quad',
        complete: () => {
          // 第二阶段：弹性回弹至严谨拓扑坐标
          node.animate(
            {
              position: target
            },
            {
              duration: phase2Duration,
              easing: 'ease-out-cubic'
            }
          );
        }
      }
    );
  });

  // 摄像机镜头配合轻度呼吸聚焦
  cy.animate(
    {
      fit: {
        eles: nodes,
        padding: 60
      }
    },
    {
      duration: totalDuration,
      easing: 'ease-out-cubic',
      complete: onComplete
    }
  );
}
