# 🚀 Node.js 安装与国内镜像换源指南

本指南专为国内网络环境编写，面向初学者，帮助你在不同操作系统（Windows、macOS、Linux）上快速搭建 Node.js 环境并配置国内高速镜像源，顺畅运行 MathMind。

---

## 📌 什么是 Node.js 与 npm？

- **Node.js**：就像是本地运行各种现代前端工具与脚本的“引擎”。
- **npm**：Node.js 自带的工具包管理器，相当于这个引擎的“官方软件商店”。
- **npx**：npm 自带的临时执行命令，能让你**无需手动下载配置**，一条命令直接在本地启动 MathMind。

> 💡 **版本要求**：推荐安装 **Node.js LTS (长期支持版，>= 18.0.0)**。

---

## 💻 第一步：安装 Node.js

请选择你当前的操作系统：

### 🪟 Windows (10 / 11)

#### 推荐方案：国内镜像安装包直达（无需魔法，速度最快）
1. 打开国内镜像下载站：[npmmirror Node.js LTS 镜像列表](https://npmmirror.com/mirrors/node/latest-v20.x/)
2. 下载 Windows 64位安装包：`node-v20.x.x-x64.msi`
3. 双击下载好的 `.msi` 文件，一路点击 **Next**，保持默认选项即可完成安装。

#### 备选方案：使用系统命令行 (winget)
在终端或 PowerShell 中执行：
```powershell
winget install OpenJS.NodeJS.LTS
```

---

### 🍎 macOS (Apple Silicon M系列 / Intel)

#### 推荐方案：国内镜像安装包直达
1. 打开国内镜像下载站：[npmmirror Node.js LTS 镜像列表](https://npmmirror.com/mirrors/node/latest-v20.x/)
2. 下载 macOS 安装包：`node-v20.x.x.pkg`
3. 双击 `.pkg` 文件，跟随安装引导完成。

#### 备选方案：通过 Homebrew 安装
如果你已安装 Homebrew，可在终端直接执行：
```bash
brew install node
```

---

### 🐧 Linux

#### Ubuntu / Debian 系列
```bash
# 通过官方源安装
sudo apt update
sudo apt install -y nodejs npm
```

#### Arch Linux
```bash
sudo pacman -S nodejs npm
```

#### CentOS / RHEL / Fedora
```bash
# Fedora
sudo dnf install -y nodejs npm

# CentOS / RHEL
sudo yum install -y nodejs npm
```

---

## ⚡ 第二步：配置国内高速镜像源（重要）

npm 默认服务器位于境外，国内网络直接下载工具包可能出现超时、缓慢或连接中断。**强烈建议切换为国内阿里云 npmmirror 镜像源**：

### 1. 一键切换为国内镜像源
打开命令行（PowerShell / CMD / Terminal），输入以下命令：
```bash
npm config set registry https://registry.npmmirror.com
```

### 2. 验证是否配置成功
输入：
```bash
npm config get registry
```
如果终端输出 `https://registry.npmmirror.com/`，说明换源成功！

> ℹ️ **如需切换回官方源（可选备用）：**
> ```bash
> npm config set registry https://registry.npmjs.org/
> ```

---

## 🔍 第三步：检查与验证环境

在终端中分别输入以下命令，确认已正确安装：

```bash
node -v
# 输出示例：v20.18.0（只要大于或等于 v18.0.0 即可）

npm -v
# 输出示例：10.8.2
```

---

## 📐 第四步：启动 MathMind

环境就绪后，直接在终端中运行：

```bash
npx mathmind
```

- 该命令会自动从镜像站拉取并启动 MathMind。
- 启动成功后，会自动在默认浏览器中打开 `http://localhost:5173`。
- 如果需要全局安装为本地独立命令常驻使用，可运行：
  ```bash
  npm install -g mathmind
  mathmind
  ```

---

## ❓ 常见问题排查 (FAQ)

### Q1: Windows PowerShell 提示“因为在此系统上禁止运行脚本...”？
这是 Windows 默认的安全策略限制。
- **解决办法**：在开始菜单搜索 `PowerShell`，右键选择 **“以管理员身份运行”**，输入并回车：
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  输入 `Y` 确认即可。

### Q2: 提示 `EACCES: permission denied`（权限不足）？
- **macOS / Linux 用户**：如果在安装全局包时遇到权限问题，建议：
  - 在命令前加上 `sudo`，如 `sudo npm install -g mathmind`；
  - 或者使用 Node 版本管理工具（如 `nvm`）管理 Node 路径。

### Q3: 端口 5173 被占用怎么办？
如果你的电脑上已有其他项目占用了 5173 端口，Vite 会自动递增尝试 5174、5175... 端口并在终端输出可访问的网址，直接点击终端给出的链接访问即可。
