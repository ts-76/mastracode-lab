# `feat/agent-teams` ブランチ レビュー報告

## 1. アーキテクチャ概要

本ブランチは Mastra Code の harness パターンを拡張し、複数エージェントを並列実行する「チーム」機能を追加する。全体構成は以下のレイヤーに分かれる：

```
types.ts (型定義)
   ↓
message-bus.ts (インメモリ Pub/Sub)    model-tiers.ts (モデル分類・自動アサイン)
   ↓                                        ↓
team-runner.ts (並列実行オーケストレーター) ←── team-create-tool.ts / team-dispatch-tool.ts
   ↓
index.ts (barrel export) → src/index.ts (エントリポイントで統合)
   ↓
TUI: event-dispatch.ts → handlers/team.ts → components/team-activity.ts / team-model-picker.ts
```

設計は明確に関心を分離しており、既存の Harness / Subagent パターンに忠実に追従している。`ToolBag` パターン（mutable bag による遅延ツール注入）は、初期化順序の問題を解決する実用的なアプローチ。

---

## 2. 各ファイルのレビュー

### 2.1 `src/harness/types.ts`

**役割**: チーム機能の全型定義を集約。

**評価**:
- ✅ JSDoc が充実しており、各フィールドの意図が明確
- ✅ `HarnessTeamMember` が `HarnessSubagent` と同じ `DynamicArgument<AgentInstructions>` パターンに従っている（一貫性良好）
- ✅ `TeamEvent` の判別共用体 (discriminated union) が `type` フィールドで正しく構成されている

**問題点**:
- ⚠️ `TeamModelSelectEvent` が `TeamEvent` 内でインライン展開されておらず、別インターフェースとして定義された後にユニオンに追加されている。これは設計上問題ないが、`TeamEvent` に追加された `TeamModelSelectEvent` 型が `types.ts` 内で同ファイルのインターフェースを参照する形になっており、判別共用体の一貫性は保たれている
- ⚠️ `TeamMemberResult` の `result` フィールドが `string` 型のみ。ストリーミング結果や構造化データ（JSON等）の表現力が低い。`unknown` やジェネリクスの検討余地あり

### 2.2 `src/harness/message-bus.ts`

**役割**: チーム内エージェント間通信用の EventEmitter ベース Pub/Sub。

**評価**:
- ✅ シンプルで十分な機能。`send()`, `receive()`, `getMessagesFor()` など用途に応じた API
- ✅ `setMaxListeners(100)` でチームメンバー数 + テストリスナーに対応

**問題点**:
- 🔴 **バグ: `receive()` が既存メッセージを削除しない**
  ```typescript
  // L37-40
  const existing = this.messages.find(
    m => (m.toMemberId === memberId || m.toMemberId === 'broadcast') && m.timestamp > Date.now() - timeoutMs,
  );
  if (existing) return existing;
  ```
  既存メッセージを返すが、配列から除去しないため、同じメッセージが複数回の `receive()` 呼び出しで重複取得される可能性がある。実際のエージェント利用では `team_message` ツール経由で push 型通知として使われるため影響は限定的だが、pull 型の `receive()` を併用すると問題になる

- ⚠️ **`receive()` のイベントリスナーが複数登録時の競合**: `handler` と `broadcastHandler` の両方が登録され、どちらかが発火した時点で `cleanup()` が呼ばれるが、Node.js の EventEmitter は同期的に emit するため、同一ティック内で両方が発火した場合は2回 `resolve` が呼ばれる可能性がある。ただし Promise は最初の `resolve` のみ有効なため実害はない

- ⚠️ **`send()` が常に `true` を返す**: JSDoc では「Returns true if the message was delivered to at least one listener」とあるが、リスナーの有無に関わらず常に `true`。コメントと実装が不一致

### 2.3 `src/harness/model-tiers.ts`

**役割**: モデルの性能ティア分類とタスク複雑度による自動アサイン。

**評価**:
- ✅ 正規表現ベースのティア分類が合理的。`opus|o3|o4|ultra|max|pro-.*(?:1\.5|2)` → heavy, `mini|flash|haiku|nano|turbo|instant|fast` → light
- ✅ フォールバックが medium なのが安全
- ✅ `classifyModels` が `hasApiKey: false` を除外する設計が良い

**問題点**:
- ⚠️ **正規表現の誤判定リスク**: `o4-mini` のケースはテストで確認されているが（L18）、`turbo` は heavy の `pro-.*(?:1\.5|2)` に引っかからないのに対し、light の `turbo` にマッチする。モデル名に turbo を含む高性能モデルが将来的に追加された場合に miscategorization が起きる。本質的にはヒューリスティックなので許容範囲だが、`TIER_PATTERNS` にコメントで既知の例外を明記すべき

- ⚠️ **`inferComplexity` の閾値が硬直**: `heavyScore > lightScore + 1` という閾値は、2語の差がないと heavy/light に分類されない。例えば instructions に "implement" (heavy) が1回、task に "quick" (light) が1回出現すると `1 > 2` が false かつ `1 > 2` が false で medium になる。実際のテストケースでは heavy と light の両方に語が含まれているためパスするが、エッジケースでの予測可能性が低い

- 💡 **改善提案**: キーワードに重み付けを導入し、スコアの差だけでなく絶対値も考慮する

### 2.4 `src/harness/team-create-tool.ts`

**役割**: AIが動的にチームを定義・実行するためのツール。

**評価**:
- ✅ Zod スキーマによる入力バリデーションが丁寧（`min(1).max(8)`, `.describe()` 付き）
- ✅ `modelStrategy` の3モード（`manual`, `ai_auto`, `user_select`）が明確に分岐
- ✅ `ToolBag` パターンによる遅延解決

**問題点**:
- 🔴 **`user_select` モードのハングリスク**:
  ```typescript
  // L133-149
  const userSelections = await new Promise<Record<string, string> | null>((resolve) => {
    harnessCtx?.registerQuestion?.(questionId, (answer: string) => {
      try {
        resolve(JSON.parse(answer) as Record<string, string>);
      } catch {
        resolve(null);
      }
    });
    emitEvent({
      type: 'team_model_select',
      ...
    } as TeamEvent);
  });
  ```
  `registerQuestion` が未定義（`harnessCtx` が `undefined`）の場合、Promise が永久に resolve されずハングする。タイムアウト機構が必要:
  ```typescript
  // 提案: タイムアウトを追加
  const timer = setTimeout(() => resolve(null), 120_000); // 2分
  harnessCtx?.registerQuestion?.(questionId, (answer) => {
    clearTimeout(timer);
    try { resolve(JSON.parse(answer)); } catch { resolve(null); }
  });
  if (!harnessCtx?.registerQuestion) {
    clearTimeout(timer);
    resolve(null);
  }
  ```

- ⚠️ **`team.id` の生成ロジック**:
  ```typescript
  // L81-84
  id: teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  ```
  空文字列の `teamName` を入力すると（Zodの`.string()`は通る）、結果的に空文字の ID になる可能性がある。最低文字長のバリデーション推奨

- ⚠️ **型アサーションの多用**: `as Record<string, any> | undefined` (L97), `as Array<{...}>` (L111, L128) など。`harnessCtx` が `any` 系で扱われているため、リファクタリング時に型安全性が失われるリスク

### 2.5 `src/harness/team-dispatch-tool.ts`

**役割**: 事前定義済みチームのディスパッチツール。

**評価**:
- ✅ 既存の `teamIds` から `z.enum()` を動的生成するアプローチが良い（型安全性）
- ✅ `teamDescriptions` を description に埋め込むことで AI にチーム一覧を提示する設計

**問題点**:
- ⚠️ **`team_dispatch` の `teamIds` が空配列の場合**: `z.enum([] as [string, ...string[]])` は TypeScript レベルではパスするが、Zod のランタイムでは失敗する。`teams.length === 0` の場合は `team_dispatch` ツール自体を登録しない（src/index.ts L218 で既に対応済み）ため実害はないが、防御的チェックを入れるべき

### 2.6 `src/harness/team-runner.ts`

**役割**: チームの並列実行オーケストレーター。中核ロジック。

**評価**:
- ✅ `Promise.allSettled` による堅牢な並列実行
- ✅ チャンクベースの同時実行制限（`maxConcurrency`）
- ✅ `AbortSignal` 対応
- ✅ `buildMemberTools` での `allowedHarnessTools` / `allowedWorkspaceTools` フィルタリング

**問題点**:
- 🔴 **デバッグ用 console.log が大量に残存**:
  ```typescript
  // L135, L201, L252
  console.log(`[team-runner] Resolved model for member "${member.id}": ...`);
  console.log(`[team-runner] Starting member "${member.id}" with tools=[...]`);
  console.log(`[team-runner] Member "${member.id}" finished: ...`);
  ```
  本番コードに `console.log/error` が散在。ロガー抽象化、または DEBUG 環境変数ベースの条件付き出力にすべき

- 🔴 **Auth診断コードの残存**:
  ```typescript
  // L203-215
  try {
    const diagStorage = new AuthStorage();
    diagStorage.reload();
    const diagCred = diagStorage.get('anthropic');
    console.log(`[team-runner] Auth diagnostic for "${member.id}"...`);
    ...
  }
  ```
  明らかにデバッグ用。本番では不要。パフォーマンスにも悪影響（メンバーごとに AuthStorage を再インスタンス化 + 再ロード）

- ⚠️ **workspace ツールフィルタリングが空オブジェクトで動作**:
  ```typescript
  // L195-196
  const allWorkspaceToolNames = workspace
    ? new Set(Object.keys({})) // workspace tools resolved at execution time
    : undefined;
  ```
  `Object.keys({})` は常に空配列を返すため、`allWorkspaceToolNames` は常に空の Set になる。コメントには "resolved at execution time" とあるが、実際には何も解決されていない。`allowedWorkspaceTools` のフィルタリングが実質的に無効化されている **バグ**

- ⚠️ **`Promise.allSettled` の rejected ケース**:
  ```typescript
  // L272-274
  allResults.push({ memberId: 'unknown', result: r.reason?.message ?? 'Unknown error', isError: true });
  ```
  `memberId: 'unknown'` だと結果のサマリーでどのメンバーの失敗か判別不可。`chunk` から `member.id` を特定する情報を持たせるべき

- ⚠️ **`agent.stream()` の後 `getFullOutput()` を呼ぶ二重消費**:
  ```typescript
  // L217-230: fullStream を消費
  const response = await agent.stream(task, {...});
  for await (const chunk of response.fullStream) { ... }

  // L249: 再度 getFullOutput() を呼ぶ
  const fullOutput = await response.getFullOutput();
  const resultText = fullOutput.text || text;
  ```
  ストリームを完全消費した後に `getFullOutput()` を呼ぶ設計。Mastra の Agent 実装が内部的にバッファリングしているなら動作するが、そうでない場合は空の結果を返す可能性がある。`text` 変数の蓄積が正しければ `fullOutput.text` は不要

### 2.7 `src/harness/index.ts`

**役割**: barrel export。

**評価**:
- ✅ 型と値のエクスポートが明確に分離
- ✅ `types.js` 拡張子付きの import が統一されている

**問題点**: なし。クリーンな構成。

### 2.8 `src/index.ts` (エントリポイント)

**役割**: createMastraCode にチーム機能を統合。

**評価**:
- ✅ `harnessToolBag` パターンによる遅延ツール注入（L198-200）
- ✅ `disableTeams` オプションによるオプトアウト
- ✅ `team_create` は常に、`team_dispatch` は設定チームがある場合のみ登録

**問題点**:
- ⚠️ **`fallbackModelId` のハードコード**:
  ```typescript
  // L214
  fallbackModelId: 'anthropic/claude-sonnet-4-20250514',
  ```
  特定のモデルIDがハードコード。設定ファイルや環境変数から取得すべき。利用可能なモデルにこのIDがない場合、フォールバックとして機能しない

---

## 3. テストのレビュー

### `message-bus.test.ts`
- ✅ 送信、ブロードキャスト、受信、タイムアウト、クリアの基本ケースを網羅
- ⚠️ `receive()` の重複取得バグのテストが欠如（同一メッセージが2回返るケース）
- 💡 並行アクセス（複数メンバーが同時に receive する）のテストがない

### `model-tiers.test.ts`
- ✅ ティア分類、複雑度推定、自動アサインの基本ケース
- ✅ `o4-mini` が heavy に分類されることを確認するエッジケース (L18)
- ⚠️ `inferComplexity` の閾値境界のテスト不足（`heavyScore === lightScore + 1` のケース）

### `team-create-tool.test.ts`
- ✅ Zod スキーマのバリデーションテスト（境界値 0, 1, 8, 9 メンバー）
- ⚠️ スキーマテストのみ。`createTeamCreateTool()` の実行時テストが欠如

### `types.test.ts`
- ⚠️ 型のインスタンス化テストのみで、実質的な検証がない。TypeScript の構造的型システムではインスタンス化できれば型互換性は保証されるが、テスト価値は低い

---

## 4. TUI コンポーネントのレビュー

### `handlers/team.ts`
- ✅ Subagent ハンドラと同じパターンで一貫性良好
- ⚠️ `handleTeamStart` で `state.allToolComponents.push(component as any)` としているが、`TeamActivityComponent` が `IToolExecutionComponent` を実装していない可能性がある。`as any` で型回避しているため、他のツールコンポーネント処理で互換性エラーが起きる可能性

### `components/team-activity.ts`
- ✅ `rebuild()` パターンでUIの完全再構築。SubagentExecutionComponent と同じアプローチ
- ✅ `focusNextMember()` によるメンバー間フォーカス切替が直感的
- ✅ ローリングウィンドウ（`MAX_MESSAGES`, `MAX_ACTIVITY_LINES`）によるメモリ管理

**問題点**:
- ⚠️ `rebuild()` が `appendTextDelta` でフォーカス時のみ呼ばれるが、フォーカスが変わった後にテキストが表示されない可能性がある。`appendTextDelta` はテキスト蓄積だけ行い、rebuild はフォーカス変更時やツールコール時に行われるため、概要モードではテキストが表示されない設計（意図的）
- ⚠️ `formatDuration` が `ms < 1000` の場合 `ms` をそのまま返すが、UI 上は `123ms` 表記と `1.2s` 表記が混在する

### `components/team-model-picker.ts`
- ✅ fuzzyFilter、スクロール、メンバー自動フォーカス遷移の UX が良好
- ⚠️ `rebuildUI()` が `buildUI()` とほぼ重複。コンポーネントの再構築パターンとしてDRYでない
- ⚠️ `useCount` が常に `0` で渡される（L321）。実際の使用回数の連携が必要

### `event-dispatch.ts`
- ✅ チームイベントを `default` ケースに集約している（`HarnessEvent` union に含まれないため `as any` キャスト）
- ⚠️ **`default` ケースでの `as any` キャスト**は TypeScript の型安全性を損なう。チームイベントが core の `HarnessEvent` 型にマージされると良いが、上流PR受け入れの懸念がある（デザインドキュメントにも記載）

---

## 5. 重要なバグ・問題のサマリー

| 重大度 | 内容 | ファイル | 行 |
|--------|------|----------|-----|
| 🔴 高 | `receive()` が既存メッセージを除去せず重複取得の可能性 | message-bus.ts | L37-40 |
| 🔴 高 | `user_select` モードで `registerQuestion` 未定義時にハング | team-create-tool.ts | L133-149 |
| 🔴 高 | workspace ツールフィルタリングが空オブジェクトで実質無効 | team-runner.ts | L195-196 |
| 🔴 中 | デバッグ用 console.log / Auth 診断コードの残存 | team-runner.ts | L135,201-215,252 |
| ⚠️ 低 | `send()` の戻り値が常に true（JSDoc と不一致） | message-bus.ts | L20-29 |
| ⚠️ 低 | `fallbackModelId` のハードコード | src/index.ts | L214 |
| ⚠️ 低 | `team.id` が空文字になる可能性 | team-create-tool.ts | L81-84 |

---

## 6. 改善提案

### 6.1 最優先（マージ前に対応すべき）

1. **team-runner.ts のデバッグコード削除**: `console.log` を `DEBUG` 環境変数の条件付き出力に変更、Auth 診断ブロックを除去
2. **team-create-tool.ts のタイムアウト追加**: `user_select` モードの Promise にタイムアウトを追加
3. **team-runner.ts L196 の修正**: `Object.keys({})` を実際の workspace ツールキー取得に修正するか、`allowedWorkspaceTools` フィルタリングの正しい実装に置換

### 6.2 推奨（品質向上）

4. **MessageBus のメッセージ消費マーク**: `receive()` で取得したメッセージに `consumed` フラグを追加し、重複取得を防止
5. **ロガー抽象化**: `console.log/error` を `@mastra/core` のロガーまたは DEBUG パッケージに置換
6. **型安全性の強化**: `harnessCtx` の `as Record<string, any>` を名前付きインターフェースに置換
7. **team-create-tool.test.ts の拡充**: `createTeamCreateTool()` のモック実行テストを追加

### 6.3 将来対応

8. **TeamEvent の HarnessEvent 統合**: `default` ケース + `as any` を回避するため、`@mastra/core` 側に TeamEvent をマージ
9. **TeamMemberResult のジェネリクス化**: `result: string` → `result: T` で構造化データに対応
10. **useCount の連携**: `TeamModelPickerComponent` に実際のモデル使用回数を渡す

---

## 7. 全体サマリー

本ブランチは **設計レベルで良く考えられており**、既存の Subagent パターンに忠実な拡張として実装されている。型定義、Zod スキーマ、イベント設計、TUI コンポーネントともに一貫性があり、可読性が高い。モデルティア分類のヒューリスティックや、Tab によるメンバー切替などの UX 細部も配慮されている。

一方で、**マージ前に必ず対応すべき3つのバグ**（Auth 診断残存、user_select ハング、workspace ツールフィルタリングの無効化）が存在する。これらは本番環境での実行時エラーや機能不全に直結する。

修正後は、マージ可能な品質レベルに達すると評価する。
