# Team Model Selection — Design Document

## 概要

team_create 実行時に、ユーザーが各チームメンバーのモデルを選択できる機能を追加する。
併せて、AIがタスクの重さを判断してモデルを自動選択する「AI自動アサイン」モードも提供する。

## 背景

現在の team_create は:
- メンバーごとの `defaultModelId` をAIが指定可能
- 省略時は親エージェントの `currentModelId` にフォールバック
- ユーザーがモデル選択UIにアクセスする手段がない
- ハードコードの `fallbackModelId` が使われる場合がある

## 設計

### 1. Harness イベント拡張

`ask_user` の `emitEvent` / `registerQuestion` パターンを拡張し、新しいイベントタイプを追加する。

```typescript
// 新しいイベントタイプ
interface TeamModelSelectEvent {
  type: 'team_model_select';
  questionId: string;
  teamName: string;
  members: Array<{
    id: string;
    name: string;
    defaultModelId?: string;
  }>;
  availableModels: ModelItem[];
}
```

### 2. TUI: TeamModelPickerComponent

`ModelSelectorComponent` をベースに、複数メンバーのモデルを一括選択できるコンポーネントを作成。

**UI構成:**
```
┌─ Team Model Selection ─────────────────────────────┐
│ Select models for team members. Enter to confirm.  │
│                                                     │
│ > researcher: anthropic/claude-sonnet-4-20250514 ◄ │
│   implementer: anthropic/claude-sonnet-4-20250514  │
│   reviewer: openai/gpt-4o                          │
│                                                     │
│ ┌─ Model Picker ────────────────────────────────┐  │
│ │ Type to search • ↑↓ navigate • Enter select   │  │
│ │ > clau                                         │  │
│ │   ● anthropic/claude-opus-4-6      ✓          │  │
│ │   ○ anthropic/claude-sonnet-4-20250514 ✓       │  │
│ │   ○ openai/gpt-4o                  ✓          │  │
│ └────────────────────────────────────────────────┘  │
│                                                     │
│ [Tab] switch member  [Enter] confirm  [Esc] cancel  │
└─────────────────────────────────────────────────────┘
```

**操作フロー:**
1. メンバー一覧を表示（Tab でメンバー切替）
2. 選択中のメンバーのモデルピッカーが展開
3. モデル選択 → 次のメンバーへ自動フォーカス
4. 全メンバー選択完了後、Enter で確定

### 3. AI自動アサインモード

team_create のスキーマに `modelStrategy` フィールドを追加。

```typescript
const TeamCreateInputSchema = z.object({
  teamName: z.string(),
  description: z.string(),
  task: z.string(),
  members: z.array(MemberSchema).min(1).max(8),
  maxConcurrency: z.number().optional(),
  modelStrategy: z.enum([
    'user_select',    // ユーザーがTUIで選択（デフォルト）
    'ai_auto',        // AIがタスクの重さで判断
    'manual',         // メンバーのdefaultModelIdをそのまま使用
  ]).optional().default('manual'),
});
```

**AI自動アサインのロジック:**

プロンプト指示でAIに以下を判断させる:
- 重いタスク（コード生成、リファクタリング）→ 高性能モデル（Opus等）
- 中程度タスク（分析、レビュー）→ 中程度モデル（Sonnet等）
- 軽いタスク（検索、フォーマット）→ 高速モデル（Haiku等）

アクティベート済みプロバイダーから利用可能なモデル一覧をツール実行時に取得し、
プロンプトにモデル情報を注入する。

### 4. 実行フロー

#### user_select モード

```
1. AI が team_create を呼び出し（modelStrategy: 'user_select'）
2. team_create の execute が harness.emitEvent({ type: 'team_model_select', ... }) を発火
3. TUI が TeamModelPickerComponent をオーバーレイ表示
4. ユーザーが各メンバーのモデルを選択 → registerQuestion の resolve を呼ぶ
5. 選択結果を受け取ってチーム実行開始
```

#### ai_auto モード

```
1. AI が team_create を呼び出し（modelStrategy: 'ai_auto'）
2. team_create の execute が listAvailableModels() で利用可能モデルを取得
3. ツール内でタスクの説明とモデル情報を元にヒューリスティックにアサイン
4. チーム実行開始
```

## 実装計画

### Phase 1: 基盤（モデル選択ダイアログ）

1. **Harness イベントハンドリング**
   - `TeamModelSelectEvent` 型定義を `types.ts` に追加
   - TUI handlers に `team_model_select` イベントのハンドリング追加
   - `harness.registerQuestion()` パターンを流用

2. **TeamModelPickerComponent**
   - `src/tui/components/team-model-picker.ts` を新規作成
   - ModelSelectorComponent をベースに複数メンバー対応に拡張
   - Tab でメンバー切替、各メンバーにモデルピッカーを表示

3. **team-create-tool.ts の拡張**
   - `modelStrategy` パラメータをスキーマに追加
   - `user_select` 時に emitEvent でピッカーを表示
   - ユーザー選択結果を members の defaultModelId にマージ

### Phase 2: AI自動アサイン

4. **モデルカテゴリ分類**
   - 利用可能モデルを性能ティアに分類: heavy / medium / light
   - `listAvailableModels()` の結果からプロバイダー/モデル名で判定

5. **AI自動アサインロジック**
   - メンバーの instructions と task から重さを推定
   - ティアに応じてモデルを自動アサイン
   - 確認用メッセージをTUIに表示

### Phase 3: 外部注入チーム対応

6. **team_dispatch のスキーマ拡張**
   - 外部注入チーム（config定義）でも defaultModelId をオプショナルに
   - 省略時は team_create と同じフォールバックロジック

## 懸念事項

- **上流PR受け入れ可能性**: カスタムイベントタイプの追加は @mastra/core 側の変更が必要になる可能性あり
  → 回避策: ツール側で emitEvent を `ask_question` タイプとして発火し、TUI側でペイロードの構造で判別
- **TUIコンポーネントの複雑性**: 複数メンバーのモデルピッカーは UI が複雑になる
  → シンプルな段階的アプローチ: メンバーごとに1回ずつ ModelSelectorComponent を表示
- **AI自動アサインの精度**: タスク重さの推定が不正確な場合がある
  → ユーザーが確認・上書きできる仕組みを必ず提供

## 実装後の現状メモ（2026-04-10 更新）

以下は、この設計以降に team runtime 側へ反映済みの内容。

- `modelStrategy: 'user_select' | 'ai_auto' | 'manual'` は実装済み
- `team_model_select` イベントと TUI のモデル選択UI は実装済み
- 共有 task board は実装済み
- `strategy: 'lead'` は **multi-phase lead orchestration** まで実装済み
  - 先頭メンバーが planner / coordinator として先に実行
  - follower は shared board の ready task を見て実行
  - open work が残る場合のみ lead が再実行される
  - assignee 優先順と no-progress / deadlock guard も追加済み
- `team_dispatch` / `team_create` の結果集約は改善済み
  - full success / partial success / error を区別して返す
  - `teamId`, `status`, `successCount`, `errorCount`, `members` を含む structured result を返す
- TUI の task board overview 改善は一段進んでいる
  - pending / in_progress / blocked / done 件数表示
  - active assignments 表示
  - collapsed 時の task board summary 表示
- team 完了時の lifecycle cleanup を追加済み
  - `pendingTeams` だけでなく `allToolComponents` からも team component を除去

ただし、まだ full orchestration / full polish ではなく、次の残件がある。

## 残件 / 推奨フォローアップ

1. **lead orchestration の多段化**
   - 現状の `strategy: 'lead'` は 1 回だけ lead が先に走る方式
   - 今後は lead が task board の状態を見ながら、段階的に follower を解放 / 再指示できるようにしたい

2. **自動タスク分解の導入**
   - 現状は lead が明示的に `team_task_create` を使って分解する必要がある
   - runtime 側で task decomposition を補助する仕組みを追加すると、使い勝手が上がる

3. **dependency-aware scheduling の強化**
   - 現状は dependency 表現と blocked 状態管理はあるが、実行順の自動制御は弱い
   - 依存完了に応じて次メンバー/次タスクを自動解放できるようにしたい

4. **structured result の活用範囲拡張**
   - `team_dispatch` / `team_create` は partial success を structured に返すようになった
   - 今後は parent agent 側や TUI 側でも `status` / `successCount` / `members` を直接活用したい

5. **TUI の task board 表示改善の継続**
   - overview の件数サマリと active assignments は追加済み
   - collapsed 完了時 summary は追加済み
   - まだ lead/follower の役割表示や、依存関係の視認性には改善余地がある

6. **メモリ/ライフサイクルまわりの再確認**
   - team 完了時に `pendingTeams` と `allToolComponents` からは cleanup するようになった
   - ただし chat 上での見え方や、長時間セッションでの寿命管理は引き続き見直し余地がある

7. **repo 全体の TypeScript エラー解消**
   - team 変更の focused tests は通っているが、repo 全体の `tsc --noEmit` は未解消
   - team 周辺の改善を merge-ready にするには、既存の広域 TS エラーも別途片付ける必要がある
