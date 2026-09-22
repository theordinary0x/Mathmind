import { GraphDataset, Project, PropositionNode, AppTheme, CanvasSettings, DEFAULT_CANVAS_SETTINGS, AutoSaveMode } from '../types';
import { DEFAULT_PROJECTS, PEANO_DATASET, EUCLID_DATASET } from '../data/seedData';
import { DEFAULT_PROJECTS_EN, PEANO_DATASET_EN, EUCLID_DATASET_EN } from '../data/seedDataEn';
import { Language } from '../i18n/types';

export function getDefaultProjects(lang: Language = 'zh'): Project[] {
  return lang === 'en' ? DEFAULT_PROJECTS_EN : DEFAULT_PROJECTS;
}

const PROJECTS_STORAGE_KEY = 'mathmind_projects_v2';
const ACTIVE_PROJ_KEY = 'mathmind_active_project_id_v2';
const THEME_STORAGE_KEY = 'mathmind_theme_v1';
const CANVAS_SETTINGS_KEY = 'mathmind_canvas_settings_v2';
const AUTOSAVE_MODE_KEY = 'mathmind_autosave_mode_v1';

export function getSavedAutoSaveMode(): AutoSaveMode {
  try {
    const saved = localStorage.getItem(AUTOSAVE_MODE_KEY);
    if (saved && ['realtime', '5s', '15s', '30s', '1m', '5m', 'manual'].includes(saved)) {
      return saved as AutoSaveMode;
    }
    return 'realtime';
  } catch {
    return 'realtime';
  }
}

export function saveAutoSaveMode(mode: AutoSaveMode): void {
  try {
    localStorage.setItem(AUTOSAVE_MODE_KEY, mode);
  } catch (err) {
    console.error('Failed to save auto-save mode:', err);
  }
}

export function getSavedCanvasSettings(): CanvasSettings {
  try {
    const raw = localStorage.getItem(CANVAS_SETTINGS_KEY);
    if (!raw) return DEFAULT_CANVAS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CANVAS_SETTINGS,
      ...parsed
    };
  } catch {
    return DEFAULT_CANVAS_SETTINGS;
  }
}

export function saveCanvasSettings(settings: CanvasSettings): void {
  try {
    localStorage.setItem(CANVAS_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save canvas settings:', err);
  }
}

export function getSavedTheme(): AppTheme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'paper') {
    return saved;
  }
  return 'dark'; // 默认启动深色模式，保护视力不刺眼
}

export function setSavedTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      saveProjects(DEFAULT_PROJECTS);
      return DEFAULT_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(p => {
        const rawNodes = Array.isArray(p.dataset?.nodes) ? p.dataset.nodes : [];
        const validIds = new Set(rawNodes.map((n: any) => String(n.id)));
        const sanitizedNodes: PropositionNode[] = rawNodes.map((n: any) => ({
          ...n,
          depends_on: Array.isArray(n.depends_on)
            ? Array.from(new Set(n.depends_on.map(String).filter((id: string) => id !== n.id && validIds.has(id))))
            : []
        }));
        return {
          ...p,
          dataset: {
            version: p.dataset?.version || '1.0.0',
            updatedAt: p.dataset?.updatedAt || new Date().toISOString(),
            nodes: sanitizedNodes
          }
        };
      });
    }
    return DEFAULT_PROJECTS;
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function getActiveProjectId(projects: Project[]): string {
  const saved = localStorage.getItem(ACTIVE_PROJ_KEY);
  if (saved && projects.some(p => p.id === saved)) {
    return saved;
  }
  return projects[0]?.id || 'proj-peano';
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJ_KEY, id);
}

export function createNewProject(
  name: string,
  template: 'blank' | 'peano' | 'euclid' = 'blank',
  lang: Language = 'zh'
): Project {
  let dataset: GraphDataset;
  if (template === 'peano') {
    dataset = JSON.parse(JSON.stringify(lang === 'en' ? PEANO_DATASET_EN : PEANO_DATASET));
  } else if (template === 'euclid') {
    dataset = JSON.parse(JSON.stringify(lang === 'en' ? EUCLID_DATASET_EN : EUCLID_DATASET));
  } else {
    dataset = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'axiom-1',
          type: 'axiom',
          title: lang === 'en' ? 'Foundational Axiom 1' : '初始公理 1',
          statement: lang === 'en' ? 'Enter the initial axiom statement here...' : '请在此输入系统的初始公理陈述...',
          proof_sketch: lang === 'en' ? 'First principle of the system, requires no proof.' : '作为体系的第一公理，无需证明。',
          depends_on: []
        }
      ]
    };
  }

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name: name.trim() || (lang === 'en' ? 'Untitled Mathematical System' : '未命名数学体系'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataset
  };

  return newProject;
}

export function sanitizeFileName(name: string, ext: string = 'json'): string {
  const clean = name.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
  return `${clean || 'mathmind_export'}.${ext}`;
}

/**
 * 另存为 / 导出到本地文件 (优先使用浏览器本地磁盘写文件 API，实现真正的另存为)
 */
export async function saveProjectAsJsonFile(project: Project): Promise<string> {
  const jsonContent = JSON.stringify(project, null, 2);
  const defaultFilename = sanitizeFileName(project.name, 'json');

  // Check if browser supports showSaveFilePicker (Chrome/Edge on Windows)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: 'MathMind 知识网络 JSON 文件',
            accept: { 'application/json': ['.json'] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonContent);
      await writable.close();
      return handle.name || defaultFilename;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('用户取消了另存为');
      }
      // Fallback to standard download
    }
  }

  // Fallback: Trigger browser file download
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", defaultFilename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
  return defaultFilename;
}

/**
 * 计算当前 LocalStorage 已使用的空间大小
 */
export function calculateStorageUsage(): { usedBytes: number; formattedSize: string } {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        if (val) {
          total += (key.length + val.length) * 2; // UTF-16 编码下字符约占 2 字节
        }
      }
    }
    if (total < 1024) return { usedBytes: total, formattedSize: `${total} B` };
    if (total < 1024 * 1024) return { usedBytes: total, formattedSize: `${(total / 1024).toFixed(1)} KB` };
    return { usedBytes: total, formattedSize: `${(total / (1024 * 1024)).toFixed(2)} MB` };
  } catch {
    return { usedBytes: 0, formattedSize: '0 KB' };
  }
}

/**
 * 导出全部项目全量数据备份 (.json)
 */
export async function exportAllProjectsBackup(projects: Project[]): Promise<string> {
  const backup = {
    app: 'MathMind',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    projectCount: projects.length,
    projects
  };
  const jsonContent = JSON.stringify(backup, null, 2);
  const defaultFilename = `mathmind_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: 'MathMind 全量备份 JSON 文件',
            accept: { 'application/json': ['.json'] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonContent);
      await writable.close();
      return handle.name || defaultFilename;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('用户取消了备份导出');
      }
    }
  }

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", defaultFilename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
  return defaultFilename;
}

export function parseImportedJson(jsonString: string): GraphDataset {
  const parsed = JSON.parse(jsonString);
  let rawNodes: any[] = [];

  // Check if it is a Project or direct GraphDataset
  if (parsed.dataset && Array.isArray(parsed.dataset.nodes)) {
    rawNodes = parsed.dataset.nodes;
  } else if (parsed.nodes && Array.isArray(parsed.nodes)) {
    rawNodes = parsed.nodes;
  } else {
    throw new Error('无效的 JSON 格式：未能找到命题 nodes 数组');
  }

  const seenIds = new Set<string>();

  // Pass 1: Ensure unique IDs and valid structural fields
  const firstPassNodes = rawNodes.map((raw: any, idx: number) => {
    const validTypes = ['axiom', 'definition', 'proposition', 'theorem', 'corollary'];
    const type = validTypes.includes(raw.type) ? raw.type : 'theorem';

    let id = String(raw.id || '').trim();
    if (!id || seenIds.has(id)) {
      id = `${id || 'node'}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(id);

    return {
      id,
      type,
      title: String(raw.title || `未命名命题 ${idx + 1}`),
      statement: String(raw.statement || ''),
      proof_sketch: String(raw.proof_sketch || ''),
      full_proof: raw.full_proof ? String(raw.full_proof) : undefined,
      note: raw.note ? String(raw.note) : undefined,
      examples: Array.isArray(raw.examples) ? raw.examples.map(String).filter(Boolean) : undefined,
      depends_on: Array.isArray(raw.depends_on) ? raw.depends_on.map(String) : [],
      position: (raw.position && typeof raw.position.x === 'number' && typeof raw.position.y === 'number')
        ? { x: raw.position.x, y: raw.position.y }
        : undefined,
      status: raw.status,
      tags: Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean) : undefined
    };
  });

  // Pass 2: Clean depends_on to only existing valid IDs, remove self-loops, and deduplicate
  const sanitizedNodes: PropositionNode[] = firstPassNodes.map(node => {
    const validDependsOn: string[] = Array.from(
      new Set(
        node.depends_on.filter((depId: string) => depId !== node.id && seenIds.has(depId))
      )
    );
    return {
      ...node,
      depends_on: validDependsOn
    };
  });

  return {
    version: parsed.version || '1.0.0',
    updatedAt: new Date().toISOString(),
    nodes: sanitizedNodes
  };
}

/**
 * Checks whether adding a dependency where `targetId` depends on `sourceId`
 * would introduce a directed cycle into the graph.
 * A cycle occurs if `sourceId` can already reach `targetId` via existing `depends_on` chains.
 */
export function wouldCreateCycle(
  nodes: PropositionNode[],
  sourceId: string,
  targetId: string
): boolean {
  if (sourceId === targetId) return true;

  const visited = new Set<string>();
  const queue = [sourceId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === targetId) return true;

    if (!visited.has(currentId)) {
      visited.add(currentId);
      const currNode = nodes.find(n => n.id === currentId);
      if (currNode) {
        const prereqs = currNode.depends_on || [];
        for (const upstreamId of prereqs) {
          if (!visited.has(upstreamId)) {
            queue.push(upstreamId);
          }
        }
      }
    }
  }

  return false;
}

/**
 * Computes downstream dependents for all nodes
 */
export function computeDownstreamMap(nodes: PropositionNode[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  if (!Array.isArray(nodes)) return map;

  for (const node of nodes) {
    if (node && node.id) {
      map[node.id] = [];
    }
  }

  for (const node of nodes) {
    if (node && node.id) {
      const prereqs = node.depends_on || [];
      for (const upstreamId of prereqs) {
        if (!map[upstreamId]) {
          map[upstreamId] = [];
        }
        map[upstreamId].push(node.id);
      }
    }
  }

  return map;
}
