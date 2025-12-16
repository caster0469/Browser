# Arc Lite Browser (Electron)

macOS (Apple Silicon) を想定した Arc 風レイアウトの軽量ブラウザ実験プロジェクトです。Chromium のフォークは使わず、Electron 標準の BrowserView を最小構成で利用します。

## 推奨フォルダ構成
```
├─ package.json        # npm scripts / Electron エントリ
└─ src
   ├─ main             # メインプロセス（ウィンドウ / BrowserView 制御）
   │  └─ main.js
   ├─ preload          # preload 経由で renderer に橋渡しする IPC のみ
   │  └─ preload.js
   └─ renderer         # UI (Arc 風サイドバー + コマンドバー)
      ├─ index.html
      ├─ renderer.js
      └─ styles.css
```

## 役割分離
- **main.js (メインプロセス)**: BrowserWindow と BrowserView の生成・配置、IPC でのナビゲーションとテーマ制御、セキュアなウィンドウ設定 (contextIsolation: true, nodeIntegration: false)。
- **preload.js**: `contextBridge` を使って最小限の API (`loadUrl`, `navigate`, `setTheme`, `onStateChange`) を renderer に公開。
- **renderer (index.html / renderer.js / styles.css)**: サイドバー UI、URL/コマンド入力、テーマ切替。IPC を介してメインプロセスへナビゲーション要求を送信し、状態更新を反映。

## セットアップ & 実行
```bash
npm install
npm start
```
macOS 上で Electron が起動し、左にサイドバー・右に BrowserView が配置された Arc 風 UI が表示されます。

## 最小構成での機能
- BrowserView で Web コンテンツを表示 (初期は https://example.com)。
- サイドバーに縦タブ、ピン留め、ワークスペース、履歴、ブックマーク、ダウンロード、検索/コマンド領域の UI プレースホルダーを配置。
- コマンドバーで URL/検索を入力し Enter で遷移。戻る / 進む / リロードボタン付き。
- ライト / ダークテーマを手動切替し、LocalStorage に保存。`nativeTheme` にも反映。
- 安全設定: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, preload 経由の最小 IPC のみ。

## 設計のポイント
- **軽さ優先**: BrowserView は 1 枚のみ。バックグラウンド処理は持たず、最小限の IPC だけを公開。
- **Arc 風レイアウト**: 左 320px のサイドバー + 右側 BrowserView のハイブリッド。将来的にワークスペースやタブ管理を拡張しやすいよう、UI をセクション分割。
- **セキュリティ**: renderer から Node API を触らせず、preload で明示的に公開した IPC のみ利用。CSP を index.html に設定。
- **拡張しやすさ**: UI/ロジック/IPC をフォルダで分離し、プレースホルダーの差し替えや状態管理拡張をしやすい構造。

## 今後の拡張アイデア
- コマンドパレット (⌘K) とキーボードショートカットを IPC 経由で実装。
- タブ / ワークスペース状態の永続化 (IndexedDB やファイルベースストレージ)。
- ダウンロードマネージャや履歴検索 UI の実装。
- BrowserView の再利用・プールや、タブ毎の partition 利用などの軽量化チューニング。
