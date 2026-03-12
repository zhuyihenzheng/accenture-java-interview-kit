# Accenture Java Interview Kit

基于候选人简历和 Accenture `R00206421` 岗位说明整理的静态题库站点。

## 内容

- `index.html`: 单列题目列表页
- `detail.html`: 题目详情页
- `phrases.html`: 在线面试高频日语短句页（精简版）
- `assets/questions.js`: 题库数据
- `assets/main.js`: 页面渲染逻辑
- `assets/styles.css`: 响应式样式
- `.github/workflows/deploy-pages.yml`: GitHub Pages 部署工作流

## 本地预览

```bash
python3 -m http.server 8000
```

然后访问 `http://127.0.0.1:8000/index.html`。

## 部署到 GitHub Pages

1. 在 GitHub 创建一个新仓库。
2. 把当前目录内容推送到该仓库的 `main` 分支。
3. 在 GitHub 仓库的 `Settings -> Pages` 中确认 `Build and deployment` 使用 `GitHub Actions`。
4. 推送后，`.github/workflows/deploy-pages.yml` 会自动部署站点。

或者直接使用：

```bash
gh auth login
./publish-public.sh your-repo-name
```

## 参考岗位

- Accenture `ソフトウェアエンジニア（Java） - テクノロジー コンサルティング本部`
- Job ID: `R00206421`
- Posted: `2024-04-09`
