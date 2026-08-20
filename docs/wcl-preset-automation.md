# WCL 预设自动更新操作文档

这套自动化按小时从 WCL 拉取排行榜预设数据，生成 JSON 文件后上传到腾讯云 COS。主小程序端会按当前职业/专精按需读取 COS 上 `wcl-presets/data-12.1` 中对应的数据文件。

当前自动化会更新：

- 全职业、全专精
- 大秘境：最顶级、10层、16层
- 团本：史诗团本、孢陨幽境
- 每套预设包含：WCL 实穿装备快照（名称、装等、主属性、耐力、护甲、四绿字）、制造业随机绿字和 WCL 返回的天赋树
- 新数据为 schema 4：只有 index 与内容文件都带 `wclCombatantSnapshot: true` 时，排行榜配装才使用同一 CombatantInfo 的角色总属性来展示配装信息；装备卡只展示，不逐件累加。旧文件继续走兼容的本地逐件计算。
- 任一装备快照或 WCL 总属性无法严格解析时，该候选不会进入输出；完整生成会先在临时目录完成生成和映射审计，再原子替换专精目录，因此失败不会覆盖 COS 现有数据。
- 有本地 WCL talent blueprint 的专精会额外生成可复制进游戏的天赋导入代码；缺 blueprint 的专精会在数据诊断里标记 `missing-blueprint`
- 如果有 blueprint 但某条记录编码失败，会保留装备和 WCL 天赋树，并标记 `encode-failed`，不会中断整个专精更新
- 排行指标：治疗专精用 `hps`，坦克和输出专精用 `dps`

## 1. 你需要准备的东西

你需要 4 个必填密钥：

```text
WCL_CLIENT_ID
WCL_CLIENT_SECRET
COS_SECRET_ID
COS_SECRET_KEY
```

还有 2 个可选配置：

```text
COS_BUCKET
COS_REGION
```

如果不填可选配置，项目默认使用：

```text
COS_BUCKET = wowlook-1308073800
COS_REGION = ap-guangzhou
```

## 2. 获取 WCL API 密钥

如果你已经有 WCL 的 Client ID / Client Secret，可以直接跳到第 4 步。

操作路径：

1. 打开 Warcraft Logs。
2. 登录你的账号。
3. 进入 API Clients 页面。
4. 创建一个 API Client。
5. 复制 `Client ID` 和 `Client Secret`。

填到 GitHub Secrets 时，对应关系是：

```text
WCL_CLIENT_ID      = WCL 的 Client ID
WCL_CLIENT_SECRET  = WCL 的 Client Secret
```

注意：Client Secret 不要写进代码、不要发到公开仓库、不要截图发出去。

## 3. 获取腾讯云 COS 密钥

腾讯云这里要拿到 `SecretId` 和 `SecretKey`。

推荐做法是创建一个子账号，只给它 COS 上传权限。第一次验证如果你不熟悉权限，也可以先用现有账号的密钥跑通，但长期不建议用主账号密钥。

操作路径大致是：

1. 打开腾讯云控制台。
2. 进入 **访问管理 CAM**。
3. 找到 **用户 / 子用户**。
4. 创建或选择一个用于自动化的子用户。
5. 给这个子用户开通 COS 写入权限。
6. 在这个子用户下面创建访问密钥。
7. 复制 `SecretId` 和 `SecretKey`。

填到 GitHub Secrets 时，对应关系是：

```text
COS_SECRET_ID   = 腾讯云 SecretId
COS_SECRET_KEY  = 腾讯云 SecretKey
```

如果你要显式填写 bucket 和地域：

```text
COS_BUCKET = wowlook-1308073800
COS_REGION = ap-guangzhou
```

## 4. 在 GitHub 里填写 Secrets

在你的 GitHub 仓库页面操作：

1. 打开项目仓库。
2. 点击顶部的 **Settings**。
3. 左侧找到 **Secrets and variables**。
4. 点击 **Actions**。
5. 点击 **New repository secret**。
6. 逐个新增下面这些 Secret：

```text
WCL_CLIENT_ID
WCL_CLIENT_SECRET
COS_SECRET_ID
COS_SECRET_KEY
```

可选再新增：

```text
COS_BUCKET
COS_REGION
```

每个 Secret 都是：

- `Name` 填变量名，例如 `WCL_CLIENT_ID`
- `Secret` 填对应的真实值
- 保存

保存后 GitHub 不会再显示 Secret 明文，这是正常的。如果填错了，就重新创建/更新这个 Secret。

## 5. 确认自动化文件已经在仓库里

项目里需要有这个文件：

```text
.github/workflows/update-wcl-presets.yml
```

它现在做两件事：

1. 先生成更新矩阵：

```bash
node scripts/list-wcl-specs.js
```

如果手动运行时没有填写 `class_key/spec_id`，它会返回全职业全专精；如果填写了，就只返回目标职业或目标专精。

2. 每个专精单独运行：

```bash
node scripts/update-wcl-presets.js
```

3. 每个专精只上传自己的目录：

```bash
node scripts/upload-cos-prefix.js --source cos-upload/wcl-presets/data-12.1/{classKey}/{specId} --prefix wcl-presets/data-12.1/{classKey}/{specId}
```

每次运行只选择 COS 中更新时间最旧的 3 个专精，并发上限为 2；这样不会耗尽 WCL 免费 API 配额，也不会重复上传其他专精的数据。

如果是局部取样运行，上传前缀会自动切到：

```text
wcl-presets-test
```

正式前缀 `wcl-presets` 只用于完整生成，避免样本覆盖正式 `index.json`。

排行榜 WCL 模式与“实时配装”完全分离：用户手动选择、替换或清空任一装备后，立即退出 WCL 总属性模式，恢复本地装备库逐件计算。

## 6. 手动跑一次

第一次建议手动跑，不要等定时任务。

操作路径：

1. 打开 GitHub 仓库。
2. 点击顶部 **Actions**。
3. 左侧选择 **Update WCL Presets**。
4. 点击右侧 **Run workflow**。
5. 选择默认分支。
6. 输入框留空时，会更新当前最旧的 3 个专精；后续定时任务会继续轮转其余专精。
7. 如果只想更新一个专精，填写：

```text
class_key = druid
spec_id   = 104
content   = all
```

如果只是快速验证一个大秘境样本，可以填写：

```text
class_key    = druid
spec_id      = 103
content      = mythic-plus
levels       = 10
encounter_id = 12993
top_mplus    = 1
```

这类带 `levels`、`encounter_id`、`content != all` 或自定义 top 数量的运行会自动写到测试前缀：

```text
wcl-presets-test/data-12.1/{classKey}/{specId}/
```

不会覆盖正式路径。

8. 点击绿色按钮运行。

运行成功后，日志里应该能看到类似：

```text
Generate WCL preset data
Upload WCL preset data to Tencent COS
COS 上传完成
```

## 7. 定时更新时间

当前定时任务配置是：

```yaml
cron: '0 * * * *'
```

GitHub Actions 的 cron 使用 UTC 时间，对应北京时间每小时整点：

```text
08:00、09:00、10:00……
```

也就是说，每小时自动更新最旧的 3 个专精；完整轮转约需 14 次运行。

## 8. COS 上会出现哪些文件

上传路径按职业和专精拆分：

```text
wcl-presets/data-12.1/{classKey}/{specId}/
```

例如火法：

```text
wcl-presets/data-12.1/mage/63/
```

例如熊T：

```text
wcl-presets/data-12.1/druid/104/
```

每个专精目录下会上传这些文件：

```text
index.json
mythic-plus-10.json
mythic-plus-16.json
mythic-plus-top.json
raid-mythic-venomous-abyss.json
mapping-audit.json
```

小程序打开 WCL 预设时会先读取：

```text
https://wowlook-1308073800.cos.ap-guangzhou.myqcloud.com/wcl-presets/data-12.1/{classKey}/{specId}/index.json
```

然后用户点哪个分类，才下载对应的那个数据文件。不会一次性下载所有 WCL 数据。

## 9. 小程序里怎么看是否更新成功

打开小程序：

1. 进入配装页面。
2. 点击 **WCL预设**。
3. 弹窗标题下面会显示更新时间，例如：

```text
6月26日 16:20更新
```

这个时间来自 COS 上的 `index.json` 里的 `generatedAt`，不是手机本地时间。

## 10. 常见问题

### GitHub Actions 报缺少 WCL_CLIENT_ID

说明 GitHub Secrets 没填，或者名字写错了。

检查：

```text
Settings -> Secrets and variables -> Actions
```

确认存在：

```text
WCL_CLIENT_ID
WCL_CLIENT_SECRET
```

### 上传 COS 失败，提示缺少 COS_SECRET_ID

说明腾讯云密钥没有填到 GitHub Secrets。

确认存在：

```text
COS_SECRET_ID
COS_SECRET_KEY
```

### 上传 COS 403

通常是腾讯云权限问题。

检查：

- SecretId / SecretKey 是否填错
- 子账号是否有 COS 写入权限
- bucket 是否是 `wowlook-1308073800`
- region 是否是 `ap-guangzhou`

### 小程序里还是旧数据

按顺序检查：

1. GitHub Actions 是否成功。
2. COS 里当前职业/专精目录的 `index.json` 是否更新，例如 `wcl-presets/data-12.1/mage/63/index.json`。
3. 浏览器打开 index.json，看 `generatedAt` 是否变了。
4. 小程序开发工具里重新编译或清缓存。

### WCL 生成失败

可能原因：

- WCL API 临时失败
- WCL 密钥失效
- 某些战报拿不到装备/天赋
- WCL 改了数据结构
- 某些专精缺少本地 WCL talent blueprint，只能显示天赋树，不能生成游戏导入码

如果只是少数战报没有装备/天赋，脚本会跳过并继续。只要最终 Action 成功，就可以先用。

## 11. 本地手动测试命令

只生成数据，不上传：

```powershell
$env:WCL_CLIENT_ID="你的WCL Client ID"
$env:WCL_CLIENT_SECRET="你的WCL Client Secret"
node scripts/update-wcl-presets.js
```

只生成一个专精：

```powershell
$env:WCL_CLASS_KEY="druid"
$env:WCL_SPEC_ID="104"
node scripts/update-wcl-presets.js
```

只生成一个大秘境样本：

```powershell
$env:WCL_CLASS_KEY="monk"
$env:WCL_SPEC_ID="270"
$env:WCL_CONTENT="mythic-plus"
$env:WCL_LEVELS="10"
$env:WCL_ENCOUNTER_ID="361753"
$env:WCL_TOP_MPLUS="1"
$env:WCL_OUTPUT_ROOT="cos-upload/wcl-presets-test"
node scripts/update-wcl-presets.js
```

局部样本默认不能写入正式目录。测试文件会生成到：

```text
cos-upload/wcl-presets-test
```

只测试上传列表，不真正上传：

```powershell
$env:COS_SECRET_ID="dummy"
$env:COS_SECRET_KEY="dummy"
node scripts/upload-cos-prefix.js --source cos-upload/wcl-presets --prefix wcl-presets --dry-run
```

真正上传 COS：

```powershell
$env:COS_SECRET_ID="你的腾讯云 SecretId"
$env:COS_SECRET_KEY="你的腾讯云 SecretKey"
$env:COS_BUCKET="wowlook-1308073800"
$env:COS_REGION="ap-guangzhou"
node scripts/upload-cos-prefix.js --source cos-upload/wcl-presets --prefix wcl-presets
```

## 12. 安全提醒

密钥只放在 GitHub Secrets 或本机环境变量里。

不要放在：

- 代码文件
- README
- issue
- 微信截图
- 聊天窗口
- 小程序前端代码

如果密钥已经泄露，建议去对应平台重新生成或禁用旧密钥。

## 参考

- GitHub Secrets 官方文档：https://docs.github.com/actions/security-guides/using-secrets-in-github-actions
- GitHub Secrets 概念说明：https://docs.github.com/en/actions/concepts/security/secrets
- 腾讯云 CAM API Key 文档：https://www.tencentcloud.com/document/product/598/32675
