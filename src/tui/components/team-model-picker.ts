/**
 * Team model picker component for selecting models for each team member.
 * Uses pi-tui overlay pattern with search, fuzzy filtering, and member tabs.
 */

import { Box, Container, fuzzyFilter, getEditorKeybindings, Input, Spacer, Text } from '@mariozechner/pi-tui';
import type { Focusable, TUI } from '@mariozechner/pi-tui';
import chalk from 'chalk';
import { theme } from '../theme.js';

// =============================================================================
// Types
// =============================================================================

export interface TeamModelPickerOptions {
  tui: TUI;
  members: Array<{ id: string; name: string; defaultModelId?: string }>;
  availableModels: Array<{
    id: string;
    provider: string;
    modelName: string;
    hasApiKey: boolean;
    useCount?: number;
  }>;
  currentModelId?: string;
  onSelect: (selections: Record<string, string>) => void;
  onCancel: () => void;
}

interface ModelItem {
  id: string;
  provider: string;
  modelName: string;
  hasApiKey: boolean;
  useCount?: number;
}

// =============================================================================
// TeamModelPickerComponent
// =============================================================================

export class TeamModelPickerComponent extends Box implements Focusable {
  private searchInput!: Input;
  private listContainer!: Container;
  private members: Array<{ id: string; name: string; defaultModelId?: string }>;
  private allModels: ModelItem[];
  private filteredModels: ModelItem[];
  private selectedIndex = 0;
  private focusedMemberIndex = 0;
  private selections: Record<string, string> = {};
  private tui: TUI;
  private onSelectCallback: (selections: Record<string, string>) => void;
  private onCancelCallback: () => void;

  // Focusable implementation
  private _focused = false;
  get focused(): boolean {
    return this._focused;
  }
  set focused(value: boolean) {
    this._focused = value;
    this.searchInput.focused = value;
  }

  constructor(options: TeamModelPickerOptions) {
    super(2, 1, text => theme.bg('overlayBg', text));

    this.tui = options.tui;
    this.members = options.members;
    this.allModels = this.sortModels(options.availableModels);
    this.filteredModels = this.allModels;
    this.onSelectCallback = options.onSelect;
    this.onCancelCallback = options.onCancel;

    // Initialize selections with defaults
    for (const member of this.members) {
      if (member.defaultModelId) {
        this.selections[member.id] = member.defaultModelId;
      }
    }

    this.buildUI();
  }

  private buildUI(): void {
    // Title
    const titleText = theme.bold(theme.fg('accent', 'Select Models for Team Members'));
    this.addChild(new Text(titleText, 0, 0));
    this.addChild(new Spacer(1));

    // Member tabs hint
    this.addChild(new Text(theme.fg('muted', 'Tab switch member • ↑↓ navigate • Enter select/confirm • Esc cancel'), 0, 0));
    this.addChild(new Spacer(1));

    // Member list
    this.buildMemberList();

    // Spacer between member list and model picker
    this.addChild(new Spacer(1));

    // Search input
    this.searchInput = new Input();
    this.searchInput.onSubmit = () => {
      this.handleEnter();
    };
    this.addChild(this.searchInput);
    this.addChild(new Spacer(1));

    // Model list container
    this.listContainer = new Container();
    this.addChild(this.listContainer);

    // Initial render
    this.updateList();
  }

  private buildMemberList(): void {
    // We rebuild this section; find and remove old member container if present
    const memberContainer = new Container();

    for (let i = 0; i < this.members.length; i++) {
      const member = this.members[i]!;
      const isFocused = i === this.focusedMemberIndex;
      const hasSelection = this.selections[member.id] !== undefined;
      const selectedModel = hasSelection ? this.selections[member.id] : undefined;

      let line: string;
      if (isFocused) {
        const cursor = theme.fg('accent', '▸ ');
        const name = theme.bold(theme.fg('accent', member.name));
        const model = hasSelection
          ? theme.fg('success', ` → ${selectedModel}`)
          : theme.fg('muted', ' → (no model)');
        line = cursor + name + model;
      } else {
        const cursor = '  ';
        const name = hasSelection ? member.name : theme.fg('muted', member.name);
        const model = hasSelection
          ? theme.fg('dim', ` → ${selectedModel}`)
          : theme.fg('muted', ' → (no model)');
        line = cursor + name + model;
      }
      memberContainer.addChild(new Text(line, 0, 0));
    }

    this.addChild(memberContainer);
  }

  private sortModels(models: ModelItem[]): ModelItem[] {
    const sorted = [...models];
    sorted.sort((a, b) => {
      // Models with API keys come first
      if (a.hasApiKey && !b.hasApiKey) return -1;
      if (!a.hasApiKey && b.hasApiKey) return 1;

      // Then by use count (higher = first)
      const aCount = a.useCount ?? 0;
      const bCount = b.useCount ?? 0;
      if (aCount !== bCount) return bCount - aCount;

      // Then by provider
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) return providerCompare;

      // Then by model name
      return a.modelName.localeCompare(b.modelName);
    });
    return sorted;
  }

  private filterModels(query: string): void {
    this.filteredModels = query
      ? fuzzyFilter(this.allModels, query, m => `${m.id} ${m.provider} ${m.modelName}`)
      : this.allModels;

    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.filteredModels.length - 1));
    this.updateList();
  }

  private getCurrentMemberModelId(): string | undefined {
    const member = this.members[this.focusedMemberIndex];
    return member ? this.selections[member.id] ?? member.defaultModelId : undefined;
  }

  private updateList(): void {
    this.listContainer.clear();

    const maxVisible = 8;
    const totalItems = this.filteredModels.length;
    const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(maxVisible / 2), totalItems - maxVisible));
    const endIndex = Math.min(startIndex + maxVisible, totalItems);

    const currentModelId = this.getCurrentMemberModelId();

    for (let i = startIndex; i < endIndex; i++) {
      const item = this.filteredModels[i];
      if (!item) continue;

      const isSelected = i === this.selectedIndex;
      const isCurrent = item.id === currentModelId;
      const checkmark = isCurrent ? theme.fg('success', ' ✓') : '';
      const noKeyIndicator = !item.hasApiKey
        ? theme.fg('error', ' ✗') + theme.fg('muted', ' (no key)')
        : '';

      let line: string;
      if (isSelected) {
        line = theme.fg('accent', '→ ' + item.id) + checkmark + noKeyIndicator;
      } else {
        const modelText = item.hasApiKey ? item.id : theme.fg('muted', item.id);
        line = '  ' + modelText + checkmark + noKeyIndicator;
      }

      this.listContainer.addChild(new Text(line, 0, 0));
    }

    // Scroll indicator
    if (startIndex > 0 || endIndex < totalItems) {
      const scrollInfo = theme.fg('muted', `(${this.selectedIndex + 1}/${totalItems})`);
      this.listContainer.addChild(new Text(scrollInfo, 0, 0));
    }

    // Empty state
    if (totalItems === 0) {
      this.listContainer.addChild(new Text(theme.fg('muted', 'No matching models'), 0, 0));
    }
  }

  private handleEnter(): void {
    const selected = this.filteredModels[this.selectedIndex];
    if (!selected) return;

    const member = this.members[this.focusedMemberIndex];
    if (!member) return;

    // If this model is already selected for the current member, and all members have selections → confirm
    if (this.selections[member.id] === selected.id) {
      if (this.allMembersSelected()) {
        this.onSelectCallback(this.selections);
        return;
      }
    }

    // Set selection for current member
    this.selections[member.id] = selected.id;

    // Auto-advance to next unselected member, or to next member
    const nextIndex = this.findNextUnselectedMember();
    if (nextIndex !== -1) {
      this.focusedMemberIndex = nextIndex;
    } else if (this.focusedMemberIndex < this.members.length - 1) {
      this.focusedMemberIndex++;
    }

    // Reset search and list for new member
    this.searchInput.setValue('');
    this.filteredModels = this.allModels;
    this.selectedIndex = 0;

    // Rebuild the UI to reflect new member focus
    this.rebuildUI();
    this.tui.requestRender();
  }

  private findNextUnselectedMember(): number {
    // Search from current position forward, then wrap around
    for (let i = this.focusedMemberIndex + 1; i < this.members.length; i++) {
      if (!this.selections[this.members[i]!.id]) return i;
    }
    for (let i = 0; i < this.focusedMemberIndex; i++) {
      if (!this.selections[this.members[i]!.id]) return i;
    }
    return -1;
  }

  private allMembersSelected(): boolean {
    return this.members.every(m => this.selections[m.id] !== undefined);
  }

  private rebuildUI(): void {
    // Clear and rebuild entire component
    this.clear();

    // Title
    const titleText = theme.bold(theme.fg('accent', 'Select Models for Team Members'));
    this.addChild(new Text(titleText, 0, 0));
    this.addChild(new Spacer(1));

    // Member tabs hint
    this.addChild(new Text(theme.fg('muted', 'Tab switch member • ↑↓ navigate • Enter select/confirm • Esc cancel'), 0, 0));
    this.addChild(new Spacer(1));

    // Member list
    this.buildMemberList();

    this.addChild(new Spacer(1));

    // Search input
    this.searchInput = new Input();
    this.searchInput.onSubmit = () => {
      this.handleEnter();
    };
    this.addChild(this.searchInput);
    this.addChild(new Spacer(1));

    // Model list container
    this.listContainer = new Container();
    this.addChild(this.listContainer);

    this.updateList();
  }

  handleInput(keyData: string): void {
    const kb = getEditorKeybindings();

    const totalItems = this.filteredModels.length;

    // Tab — switch to next member
    if (keyData === '\t') {
      this.focusedMemberIndex = (this.focusedMemberIndex + 1) % this.members.length;
      // Reset search for new member
      this.searchInput.setValue('');
      this.filteredModels = this.allModels;
      this.selectedIndex = 0;
      this.rebuildUI();
      this.tui.requestRender();
    }
    // Shift+Tab — switch to previous member
    else if (keyData === '\x1b[Z') {
      this.focusedMemberIndex = (this.focusedMemberIndex - 1 + this.members.length) % this.members.length;
      this.searchInput.setValue('');
      this.filteredModels = this.allModels;
      this.selectedIndex = 0;
      this.rebuildUI();
      this.tui.requestRender();
    }
    // Up arrow
    else if (kb.matches(keyData, 'selectUp')) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? totalItems - 1 : this.selectedIndex - 1;
      this.updateList();
      this.tui.requestRender();
    }
    // Down arrow
    else if (kb.matches(keyData, 'selectDown')) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === totalItems - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
      this.tui.requestRender();
    }
    // Enter
    else if (kb.matches(keyData, 'selectConfirm')) {
      this.handleEnter();
    }
    // Escape or Ctrl+C
    else if (kb.matches(keyData, 'selectCancel')) {
      this.onCancelCallback();
    }
    // Pass everything else to search input
    else {
      this.searchInput.handleInput(keyData);
      this.filterModels(this.searchInput.getValue());
      this.tui.requestRender();
    }
  }
}
