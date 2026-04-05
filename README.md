# mastracode-lab

[Mastra Code](https://github.com/mastra-ai/mastra/tree/main/mastracode) のフォークをベースにした、個人の検証・実験用リポジトリです。

> **本家ではありません。** 公式の Mastra Code は上記リンク先をご参照ください。

## 目的

- 拡張アダプタ機構（スキル探索・警告バッファリング・ハーネス境界）の検証
- 本家へのフィードバック・PR 作成に向けた動作確認
- ローカル環境での挙動確認・デバッグ

## パッケージ

| 項目 | 値 |
|---|---|
| package | `@ts-76/mastracode-lab` |
| bin | `mc-lab` |
| registry | GitHub Packages (`npm.pkg.github.com`) |
| upstream | [mastra-ai/mastra/mastracode](https://github.com/mastra-ai/mastra/tree/main/mastracode) |

## インストール

```bash
# .npmrc に認証を設定
echo "@ts-76:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" >> .npmrc

npm install @ts-76/mastracode-lab
```

## ライセンス

Apache-2.0 — コードの大部分は [Mastra](https://github.com/mastra-ai/mastra) 由来です。
