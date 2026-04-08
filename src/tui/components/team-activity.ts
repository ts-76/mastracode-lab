/**
 * Team activity rendering component.
 * Shows real-time activity from an agent team execution:
 *  - Member status list with streaming indicators
 *  - Inter-member message bus activity (rolling window)
 *  - Per-member text output when focused
 *  - Collapse/expand support (Ctrl+E)
 *
 * Follows the same rendering patterns as SubagentExecutionComponent:
 *  - Bordered box with top/bottom borders
 *  - Tool calls show icon + name + arg summary (using summarizeArgs)
 *  - Messages properly handle newlines
 *  - Rolling window caps for large outputs
 */

import { Container, Spacer, Text } from '@mariozechner/pi-tui';
import type { TUI } from '@mariozechner/pi-tui';
import { BOX_INDENT, getTermWidth, theme } from '../theme.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MemberInfo {
  id: string;
  name: string;
  modelId?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  text: string;
  toolCalls: Array<{ name: string; args?: unknown; result?: string; done: boolean; isError?: boolean }>;
  durationMs?: number;
}

interface MessageEntry {
  from: string;
  to: string;
  content: string;
}

type FocusTarget = 'overview' | string; // 'overview' or a memberId

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 20;
const MAX_ACTIVITY_LINES = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export class TeamActivityComponent extends Container {
  private ui: TUI;

  // Team info
  private teamId: string;
  private task: string;
  private startTime = Date.now();
  private done = false;
  private durationMs = 0;

  // Members keyed by id
  private members = new Map<string, MemberInfo>();
  private memberOrder: string[] = []; // preserves insertion order

  // Inter-member messages
  private messages: MessageEntry[] = [];

  // Focus
  private focus: FocusTarget = 'overview';

  // Expand
  private expanded = false;

  constructor(teamId: string, task: string, ui: TUI) {
    super();
    this.teamId = teamId;
    this.task = task;
    this.ui = ui;
    this.rebuild();
  }

  // ── Mutation API ──────────────────────────────────────────────────────

  addMember(memberId: string, name: string, modelId?: string): void {
    if (!this.members.has(memberId)) {
      this.memberOrder.push(memberId);
    }
    this.members.set(memberId, {
      id: memberId,
      name,
      modelId,
      status: 'running',
      text: '',
      toolCalls: [],
    });
    this.rebuild();
  }

  appendTextDelta(memberId: string, delta: string): void {
    const m = this.members.get(memberId);
    if (m) {
      m.text += delta;
      // Only rebuild if this member is focused (avoid rebuilding on every token otherwise)
      if (this.focus === memberId) {
        this.rebuild();
      }
    }
  }

  addToolCall(memberId: string, toolName: string, args?: unknown): void {
    const m = this.members.get(memberId);
    if (m) {
      m.toolCalls.push({ name: toolName, args, done: false });
      this.rebuild();
    }
  }

  addToolResult(memberId: string, toolName: string, result?: string, isError?: boolean): void {
    const m = this.members.get(memberId);
    if (m) {
      for (let i = m.toolCalls.length - 1; i >= 0; i--) {
        const tc = m.toolCalls[i]!;
        if (tc.name === toolName && !tc.done) {
          tc.done = true;
          tc.result = result;
          tc.isError = isError;
          break;
        }
      }
      this.rebuild();
    }
  }

  addMessage(from: string, to: string, content: string): void {
    this.messages.push({ from, to, content });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.rebuild();
  }

  finishMember(memberId: string, isError: boolean, durationMs: number): void {
    const m = this.members.get(memberId);
    if (m) {
      m.status = isError ? 'error' : 'done';
      m.durationMs = durationMs;
      this.rebuild();
    }
  }

  finish(_results: Record<string, string>): void {
    this.done = true;
    this.durationMs = Date.now() - this.startTime;
    this.rebuild();
  }

  setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    this.rebuild();
  }

  /** Cycle focus: overview → member1 → member2 → … → overview */
  focusNextMember(): void {
    if (this.focus === 'overview') {
      this.focus = this.memberOrder[0] ?? 'overview';
    } else {
      const idx = this.memberOrder.indexOf(this.focus);
      if (idx >= 0 && idx < this.memberOrder.length - 1) {
        this.focus = this.memberOrder[idx + 1]!;
      } else {
        this.focus = 'overview';
      }
    }
    this.rebuild();
  }

  get isDone(): boolean {
    return this.done;
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  private rebuild(): void {
    this.clear();

    const b = (char: string) => theme.bold(theme.fg('accent', char));
    const termWidth = getTermWidth();
    const maxLineWidth = termWidth - 6 - BOX_INDENT * 2;

    // Footer info
    const teamLabel = theme.bold(theme.fg('toolTitle', 'team'));
    const durationStr = this.done ? theme.fg('muted', ` ${formatDuration(this.durationMs)}`) : '';
    const statusIcon = this.done
      ? this.anyError()
        ? theme.fg('error', ' ✗')
        : theme.fg('success', ' ✓')
      : theme.fg('muted', ' ⋯');
    const focusLabel = this.focus !== 'overview' ? theme.fg('muted', ` [${this.getMemberName(this.focus)}]`) : '';
    const footerText = `${teamLabel} ${theme.fg('accent', this.teamId)}${durationStr}${statusIcon}${focusLabel}`;

    // When done and not expanded, show single-line summary
    if (this.done && !this.expanded) {
      const summary = this.buildMemberSummary();
      this.addChild(new Text(`${b('╰──')} ${footerText}  ${summary}`, BOX_INDENT, 0));
      this.invalidate();
      this.ui.requestRender();
      return;
    }

    // ── Top border ──
    this.addChild(new Text(b('╭──'), BOX_INDENT, 0));

    // ── Task description (1 line truncated) ──
    const taskPreview = this.task.length > maxLineWidth ? this.task.slice(0, maxLineWidth - 1) + '…' : this.task;
    this.addChild(new Text(`${b('│')} ${theme.fg('muted', taskPreview)}`, BOX_INDENT, 0));

    // ── Focus-dependent content ──
    if (this.focus !== 'overview') {
      this.renderMemberDetail(b, maxLineWidth);
    } else {
      this.renderOverview(b, maxLineWidth);
    }

    // ── Bottom border ──
    this.addChild(new Text(`${b('╰──')} ${footerText}  ${theme.fg('muted', '(ctrl+t to focus)')}`, BOX_INDENT, 0));
    this.addChild(new Spacer(1));

    this.invalidate();
    this.ui.requestRender();
  }

  private renderOverview(b: (c: string) => string, _maxLineWidth: number): void {
    // ── Member status list ──
    this.addChild(new Text(`${b('│')} ${theme.fg('muted', '─── members ───')}`, BOX_INDENT, 0));

    for (const id of this.memberOrder) {
      const m = this.members.get(id);
      if (!m) continue;
      const icon = m.status === 'done'
        ? theme.fg('success', '✓')
        : m.status === 'error'
          ? theme.fg('error', '✗')
          : theme.fg('muted', '⋯');
      const modelLabel = m.modelId ? theme.fg('muted', ` (${shortModel(m.modelId)})`) : '';
      const durLabel = m.durationMs != null ? theme.fg('muted', ` ${formatDuration(m.durationMs)}`) : '';
      const toolLabel = m.toolCalls.length > 0 ? theme.fg('muted', ` [${m.toolCalls.length} tools]`) : '';
      const line = `${icon} ${theme.bold(m.name)}${modelLabel}${durLabel}${toolLabel}`;
      this.addChild(new Text(`${b('│')} ${line}`, BOX_INDENT, 0));
    }

    // ── Messages (with proper newline handling) ──
    if (this.messages.length > 0) {
      this.addChild(new Text(`${b('│')} ${theme.fg('muted', '─── messages ───')}`, BOX_INDENT, 0));
      const visibleMessages = this.expanded ? this.messages : this.messages.slice(-5);
      for (const msg of visibleMessages) {
        const toLabel = msg.to === '__broadcast__' ? 'all' : msg.to;
        const headerLine = `${theme.fg('muted', `${msg.from} → ${toLabel}:`)}`;
        // Split content by newlines and render each line separately
        const contentLines = msg.content.split('\n');
        // First line with header
        const firstContent = contentLines[0]!.length > _maxLineWidth - 20
          ? contentLines[0]!.slice(0, _maxLineWidth - 21) + '…'
          : contentLines[0]!;
        this.addChild(new Text(`${b('│')} ${headerLine} ${firstContent}`, BOX_INDENT, 0));
        // Remaining lines (continuation)
        for (let i = 1; i < contentLines.length; i++) {
          const cl = contentLines[i]!.length > _maxLineWidth - 4
            ? contentLines[i]!.slice(0, _maxLineWidth - 5) + '…'
            : contentLines[i]!;
          if (cl.trim()) {
            this.addChild(new Text(`${b('│')}   ${cl}`, BOX_INDENT, 0));
          }
        }
      }
    }
  }

  private renderMemberDetail(b: (c: string) => string, maxLineWidth: number): void {
    const m = this.members.get(this.focus);
    if (!m) {
      this.focus = 'overview';
      this.rebuild();
      return;
    }

    const modelLabel = m.modelId ? theme.fg('muted', ` (${shortModel(m.modelId)})`) : '';
    this.addChild(new Text(`${b('│')} ${theme.bold(theme.fg('accent', m.name))}${modelLabel}`, BOX_INDENT, 0));

    // ── Tool calls (same pattern as SubagentExecutionComponent) ──
    if (m.toolCalls.length > 0) {
      this.addChild(new Text(`${b('│')} ${theme.fg('muted', '───')}`, BOX_INDENT, 0));

      const activityLines = m.toolCalls.map(tc => formatToolCallLine(tc, maxLineWidth));

      // Rolling window while streaming, collapsible when done
      const cap = MAX_ACTIVITY_LINES;
      let displayLines = activityLines;
      let hiddenCount = 0;
      if (!this.expanded && activityLines.length > cap + 1) {
        hiddenCount = activityLines.length - cap;
        displayLines = activityLines.slice(-cap);
      }

      if (hiddenCount > 0) {
        this.addChild(new Text(`${b('│')} ${theme.fg('muted', `  ... ${hiddenCount} more above`)}`, BOX_INDENT, 0));
      }

      const activityContent = displayLines.map(line => `${b('│')} ${line}`).join('\n');
      this.addChild(new Text(activityContent, BOX_INDENT, 0));
    }

    // ── Streaming text (word-wrapped, same pattern as SubagentExecutionComponent task) ──
    if (m.text) {
      this.addChild(new Text(`${b('│')} ${theme.fg('muted', '─── output ───')}`, BOX_INDENT, 0));
      const rawLines = m.text.split('\n');
      const wrappedLines: string[] = [];
      const innerWidth = maxLineWidth - 4; // account for "│ " prefix
      for (const line of rawLines) {
        if (line.length > innerWidth) {
          let remaining = line;
          while (remaining.length > innerWidth) {
            const breakAt = remaining.lastIndexOf(' ', innerWidth);
            const splitAt = breakAt > 0 ? breakAt : innerWidth;
            wrappedLines.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt).trimStart();
          }
          if (remaining) wrappedLines.push(remaining);
        } else {
          wrappedLines.push(line);
        }
      }
      const visibleLines = this.expanded ? wrappedLines : wrappedLines.slice(-MAX_ACTIVITY_LINES);
      if (!this.expanded && wrappedLines.length > MAX_ACTIVITY_LINES) {
        this.addChild(new Text(`${b('│')} ${theme.fg('muted', `... ${wrappedLines.length - MAX_ACTIVITY_LINES} lines above`)}`, BOX_INDENT, 0));
      }
      const textContent = visibleLines
        .map(line => `${b('│')} ${line}`)
        .join('\n');
      if (textContent.trim()) {
        this.addChild(new Text(textContent, BOX_INDENT, 0));
      }
    }
  }

  private buildMemberSummary(): string {
    const parts: string[] = [];
    for (const id of this.memberOrder) {
      const m = this.members.get(id);
      if (!m) continue;
      const icon = m.status === 'done' ? '✓' : m.status === 'error' ? '✗' : '⋯';
      parts.push(`${icon}${m.name}`);
    }
    return theme.fg('muted', parts.join(' '));
  }

  private anyError(): boolean {
    for (const m of this.members.values()) {
      if (m.status === 'error') return true;
    }
    return false;
  }

  private getMemberName(id: string): string {
    return this.members.get(id)?.name ?? id;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (same patterns as SubagentExecutionComponent)
// ─────────────────────────────────────────────────────────────────────────────

function formatToolCallLine(tc: MemberInfo['toolCalls'][0], _maxWidth: number): string {
  const icon = tc.done ? (tc.isError ? theme.fg('error', '✗') : theme.fg('success', '✓')) : theme.fg('muted', '⋯');
  const name = theme.fg('toolTitle', tc.name);
  const argsSummary = summarizeArgs(tc.args);
  return `${icon} ${name} ${argsSummary}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function shortModel(modelId: string): string {
  return modelId
    .replace(/claude-3[-_]5[-_]/, 'claude-3.5-')
    .replace(/-20\d{6}$/, '')
    .replace(/^anthropic\//, '')
    .replace(/^openai\//, '')
    .slice(0, 30);
}

function summarizeArgs(args: unknown): string {
  if (!args || typeof args !== 'object') return '';
  const obj = args as Record<string, unknown>;
  const parts: string[] = [];

  // Special handling for task_write tool
  if (obj.tasks && Array.isArray(obj.tasks)) {
    const tasks = obj.tasks as Array<{
      content?: string;
      status?: string;
      activeForm?: string;
    }>;
    const taskSummaries = tasks.map(t => {
      const icon = t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '→' : '○';
      const content = t.content || t.activeForm || 'task';
      return `${icon} ${content}`;
    });
    return theme.fg('muted', taskSummaries.join(', '));
  }

  for (const [_key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      const short = val.length > 40 ? val.slice(0, 40) + '…' : val;
      parts.push(theme.fg('muted', short));
    } else if (Array.isArray(val)) {
      parts.push(theme.fg('muted', `${val.length} items`));
    } else if (typeof val === 'object' && val !== null) {
      parts.push(theme.fg('muted', '{...}'));
    }
  }
  return parts.join(' ');
}
