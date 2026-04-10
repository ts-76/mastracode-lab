import { describe, expect, it, vi } from 'vitest';

import { TeamActivityComponent } from '../components/team-activity.js';

function collectText(node: unknown): string[] {
  if (!node || typeof node !== 'object') {
    return [];
  }

  const record = node as Record<string, unknown>;
  const current = typeof record.text === 'string' ? [record.text] : [];
  const children = Array.isArray(record.children)
    ? record.children.flatMap(child => collectText(child))
    : [];

  return [...current, ...children];
}

describe('TeamActivityComponent task board rendering', () => {
  it('shows task-board counts and active assignments in overview mode', () => {
    const ui = { requestRender: vi.fn() } as any;
    const component = new TeamActivityComponent('team-a', 'Ship feature', ui);

    component.addMember('lead', 'Lead');
    component.addMember('worker', 'Worker');
    component.setTasks([
      { id: 'task-1', title: 'Plan rollout', status: 'pending' },
      { id: 'task-2', title: 'Implement API', status: 'in_progress', assignee: 'worker' },
      { id: 'task-3', title: 'Wait for design', status: 'blocked', assignee: 'lead', dependsOn: ['task-1'] },
      { id: 'task-4', title: 'Ship docs', status: 'done' },
    ]);

    const rendered = collectText(component).join('\n');

    expect(rendered).toContain('pending 1');
    expect(rendered).toContain('in progress 1');
    expect(rendered).toContain('blocked 1');
    expect(rendered).toContain('done 1');
    expect(rendered).toContain('active assignments');
    expect(rendered).toContain('Worker');
    expect(rendered).toContain('Implement API');
  });

  it('collapses long task boards behind a more-tasks indicator until expanded', () => {
    const ui = { requestRender: vi.fn() } as any;
    const component = new TeamActivityComponent('team-a', 'Ship feature', ui);

    component.setTasks(Array.from({ length: 10 }, (_, index) => ({
      id: `task-${index + 1}`,
      title: `Task ${index + 1}`,
      status: 'pending' as const,
    })));

    let rendered = collectText(component).join('\n');
    expect(rendered).toContain('... 2 more tasks (expand to view all)');
    expect(rendered).not.toContain('Task 10');

    component.setExpanded(true);
    rendered = collectText(component).join('\n');
    expect(rendered).toContain('Task 10');
  });

  it('includes task board summary in collapsed done state', () => {
    const ui = { requestRender: vi.fn() } as any;
    const component = new TeamActivityComponent('team-a', 'Ship feature', ui);

    component.addMember('lead', 'Lead');
    component.finishMember('lead', false, 1200);
    component.setTasks([
      { id: 'task-1', title: 'Plan rollout', status: 'pending' },
      { id: 'task-2', title: 'Implement API', status: 'in_progress', assignee: 'lead' },
      { id: 'task-3', title: 'Ship docs', status: 'done' },
    ]);
    component.finish({ lead: 'done' });

    const rendered = collectText(component).join('\n');
    expect(rendered).toContain('tasks ○1');
    expect(rendered).toContain('→1');
    expect(rendered).toContain('✓1');
    expect(rendered).toContain('active Lead');
  });
});
