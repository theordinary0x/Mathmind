import { CopilotMessage } from '../types/copilot';

/**
 * 格式化单条消息为 Markdown
 */
export function formatMessageToMarkdown(msg: CopilotMessage): string {
  const roleName = msg.role === 'user' ? '👤 **我**' : '✨ **Math Copilot**';
  const timeStr = new Date(msg.timestamp).toLocaleString();
  const parts: string[] = [`### ${roleName} (${timeStr})\n`];

  // 选区上下文
  if (msg.contextSnapshot && msg.contextSnapshot.nodeTitles.length > 0) {
    parts.push(`> 📍 基于选区: ${msg.contextSnapshot.nodeTitles.join(', ')}\n`);
  }

  // 附带文件
  if (msg.attachment) {
    parts.push(`> 📎 附带文件: \`${msg.attachment.name}\` (${(msg.attachment.size / 1024).toFixed(1)} KB)\n`);
  }

  // 消息正文
  parts.push(`${msg.content}\n`);

  // 变更提案摘要
  if (msg.diffProposal && msg.diffProposal.diff) {
    const diff = msg.diffProposal.diff;
    parts.push(`\n**[图谱变更方案建议]**`);
    if (diff.summary) parts.push(`- 概要: ${diff.summary}`);
    if (diff.add_nodes && diff.add_nodes.length > 0) {
      parts.push(`- 建议新增命题: ${diff.add_nodes.map(n => `《${n.title}》(${n.type})`).join(', ')}`);
    }
    if (diff.update_nodes && diff.update_nodes.length > 0) {
      parts.push(`- 建议优化命题: ${diff.update_nodes.length} 个`);
    }
    parts.push('\n');
  }

  return parts.join('\n');
}

/**
 * 将整场对话导出为标准 Markdown 文本
 */
export function formatFullChatToMarkdown(sessionTitle: string, messages: CopilotMessage[]): string {
  const header = `# MathMind Copilot 对话记录 - ${sessionTitle}
*导出时间: ${new Date().toLocaleString()}*

---

`;

  const body = messages
    .filter(m => m.id !== 'msg_welcome' || messages.length === 1)
    .map(formatMessageToMarkdown)
    .join('\n\n---\n\n');

  return header + body;
}

/**
 * 导出对话为本地 .md 文件并触发浏览器下载
 */
export function exportChatToMarkdown(sessionTitle: string, messages: CopilotMessage[]): void {
  const mdContent = formatFullChatToMarkdown(sessionTitle, messages);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = sessionTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `MathMind_Copilot_${safeTitle}_${dateStr}.md`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 一键复制整场对话到剪贴板
 */
export async function copyChatToClipboard(sessionTitle: string, messages: CopilotMessage[]): Promise<boolean> {
  try {
    const mdContent = formatFullChatToMarkdown(sessionTitle, messages);
    await navigator.clipboard.writeText(mdContent);
    return true;
  } catch (err) {
    console.error('Failed to copy chat to clipboard:', err);
    return false;
  }
}
