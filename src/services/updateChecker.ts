import { APP_VERSION, GITHUB_API_LATEST_RELEASE, GITHUB_RELEASES_URL } from '../config/appInfo';

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseName: string;
  releaseNotes: string;
  releaseUrl: string;
  publishedAt: string;
  exeAsset?: ReleaseAsset;
  apkAsset?: ReleaseAsset;
}

/**
 * 比较两个语义化版本号 (SemVer: major.minor.patch)
 * 返回值:
 *  1: v1 > v2
 * -1: v1 < v2
 *  0: v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * 请求 GitHub Releases API 检查最新可用版本
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 秒超时保护

  try {
    const response = await fetch(GITHUB_API_LATEST_RELEASE, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 403) {
      throw new Error('GitHub API 请求频次受限（每小时 60 次）。请稍后再试，或直接访问 Releases 页面查看。');
    }

    if (response.status === 404) {
      throw new Error('未在远端仓库找到任何已发布的 Release 版本。');
    }

    if (!response.ok) {
      throw new Error(`检查更新失败 (HTTP ${response.status})`);
    }

    const data = await response.json();
    const tag = (data.tag_name || '').replace(/^v/, '');
    const hasUpdate = compareSemver(tag, APP_VERSION) > 0;

    let exeAsset: ReleaseAsset | undefined;
    let apkAsset: ReleaseAsset | undefined;

    if (Array.isArray(data.assets)) {
      for (const asset of data.assets) {
        const name = (asset.name || '').toLowerCase();
        if (name.endsWith('.exe')) {
          exeAsset = {
            name: asset.name,
            downloadUrl: asset.browser_download_url,
            size: asset.size || 0
          };
        } else if (name.endsWith('.apk')) {
          apkAsset = {
            name: asset.name,
            downloadUrl: asset.browser_download_url,
            size: asset.size || 0
          };
        }
      }
    }

    return {
      currentVersion: APP_VERSION,
      latestVersion: tag || APP_VERSION,
      hasUpdate,
      releaseName: data.name || `v${tag}`,
      releaseNotes: data.body || '',
      releaseUrl: data.html_url || GITHUB_RELEASES_URL,
      publishedAt: data.published_at || '',
      exeAsset,
      apkAsset
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('请求 GitHub 超时，请检查本地网络连接。');
      }
      throw err;
    }
    throw new Error('无法连接到 GitHub 检查更新');
  }
}
