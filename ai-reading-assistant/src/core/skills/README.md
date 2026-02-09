# Skills 模块说明

该文件夹负责管理 AI 助手的外部工具能力。

## 核心功能
- **Skill 接口**: 定义了工具的名称、描述、参数架构（JSON Schema）以及执行函数。
- **SkillManager**: 负责注册各种技能并在 AI 进行 Tool Call 时进行分发。
- **MCP 兼容性**: 工具定义符合 Model Context Protocol 规范，便于未来无缝对接标准 MCP 服务。

## 如何扩展
只需在 `index.ts` 中调用 `skillManager.registerSkill()` 并传入符合接口要求的对象即可。
