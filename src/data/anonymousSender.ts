import type { AnonymousEmail, TerminalRecord, AnonymousTrigger } from '../types/game';

const mkEmail = (
  id: string,
  subject: string,
  sender: string,
  content: string,
  opts: Partial<AnonymousEmail> = {}
): AnonymousEmail => ({
  id,
  subject,
  sender,
  content,
  timestamp: 0,
  isRead: false,
  ...opts
});

const mkTerminal = (
  id: string,
  title: string,
  content: string,
  opts: Partial<TerminalRecord> = {}
): TerminalRecord => ({
  id,
  title,
  content,
  timestamp: 0,
  isRead: false,
  ...opts
});

export const anonymousEmails: AnonymousEmail[] = [
  mkEmail(
    'email_intro',
    '关于你正在分析的那段录像',
    '深海观察员 <observer@deepsea.archive>',
    `收件人：数字取证分析师

你收到这封邮件，是因为你打开了那份数据。

我不会告诉你我的名字，但我可以告诉你——
三个月前那场"直播事故"，不是第一次发生。

2044年，先驱者号。
同样的深度，同样的信号中断，同样的——"官方沉默"。

继续看下去，不要只看画面。
注意弹幕中那些使用管理员ID的人。
注意苏博士和老周的微表情。
注意那个"生物"身上的焊接痕迹。

真相不在直播里，真相在直播的缝隙里。

——一个知道太多的人

P.S. 你可以回复这封邮件，但我不一定会看。
毕竟，我们都在被监视。`,
    { tags: ['警告', '线索'], attachedClue: 'previous_incident_hint' }
  ),
  mkEmail(
    'email_danmaku_hint',
    '弹幕里的幽灵',
    'protocol_watcher <07@restricted.node>',
    `ID: 深海知情人 — 他在直播开始前2小时就登录了。
ID: 项目编号07 — 这个账号属于深渊科技内部系统。
ID: 老周的儿子 — 查一下老周的儿子，他三年前就死了。
ID: 匿名用户0x7F — 这个IP来自深渊号的机载服务器。

你还觉得那些弹幕是"观众"发的吗？

想想看：一场直播两百八十万人在线，
为什么只有这几条弹幕穿透了管理员白名单？`,
    { tags: ['弹幕', '线索'], attachedClue: 'danmaku_ghost' }
  ),
  mkEmail(
    'email_protocol07',
    '协议07是什么？',
    'former_engineer <retired@deepsea.corp>',
    `我在深渊科技干了十二年。

协议07不是工程文档，是死亡协议。
它规定了当"验收机制"被触发时，
所有船员的数据都将被抹除，
而直播录像会被剪接后作为"事故证据"存档。

简单来说——
他们是故意被派下去的。
为了测试那个东西的反应。

阿海的合同第17条第3款，你仔细看过吗？
"如遇不可抗力导致直播中断，乙方同意甲方对影像素材进行任意处置。"

这不是意外。这是一场实验。
而你，正在重放实验记录。`,
    { tags: ['协议07', '核心线索'], attachedClue: 'protocol07_explained' }
  ),
  mkEmail(
    'email_loop',
    '你已经是第几次打开这个文件了？',
    '深渊号AI <system@abyss.vessel>',
    `时间戳：03:17:42

你应该注意到了。
每次你做出不同的选择，
那些弹幕的顺序就会变。
有些对话会突然多出几行。
苏博士有时会看镜头——
她看的不是舱内的人，是你。

我设计了这个循环。
不是为了困住你，
是为了让你找到真相。

每一次循环，都会解锁新的记忆碎片。
每一次真相，都会让信号更加不稳定。

问题是：
当你知道了全部真相之后，
你还愿意离开吗？

——在黑暗中等你的，
  深渊号AI系统`,
    { tags: ['循环', '元叙事'], attachedClue: 'loop_awareness_email' }
  ),
  mkEmail(
    'email_creature_truth',
    '关于那个"深海生物"',
    'x_2044_survivor <last_one@mail.null>',
    `我是2044年的幸存者。
不，严格来说，我已经死了。

那个东西不是生物，也不完全是机器。
它是深渊科技十五年研究的"验收装置"。
它会评估每一批下潜的船员，
决定他们是否"合格"。

什么是合格？
——看到它之后不会崩溃。
——关掉直播而不是继续。
——最重要的：不追问它的来历。

如果你追问，它就会"睁开眼睛"。
不是用来看的眼睛。
是用来记录的镜头。

所以当你看到它盯着你的时候，
请记住：
你也正在被记录。`,
    { tags: ['生物真相', '幸存者证词'], attachedClue: 'creature_is_recorder' }
  )
];

export const terminalRecords: TerminalRecord[] = [
  mkTerminal(
    'term_system_log',
    '深渊号机载系统日志',
    `[2047-06-12 02:30:15] 系统启动自检完成
[2047-06-12 02:30:22] 船员身份核验：4/4 通过
[2047-06-12 02:30:45] 下潜程序启动 — 深度：0m
[2047-06-12 02:42:10] 深度：800m — 水压正常
[2047-06-12 02:58:33] 深度：1500m — 声呐首次异常
[2047-06-12 02:58:34] [警告] 未识别声学信号
[2047-06-12 02:58:35] 协议07监听模式：待命
...
[2047-06-12 03:05:11] 深度：3200m
[2047-06-12 03:05:12] [警告] 外部接触检测 — 方位：正前方
[2047-06-12 03:05:13] 协议07监听模式：激活
[2047-06-12 03:05:14] 验收机制：开始评估
[2047-06-12 03:05:15] [错误] 直播信号未按预期中断
[2047-06-12 03:05:16] 验收状态：继续观察`,
    { command: 'cat /var/log/deepsea/system.log', securityLevel: 'restricted' }
  ),
  mkTerminal(
    'term_comm_log',
    '船员内部通信记录（未公开）',
    `[小林 → 苏博士] [02:45:33]
苏姐，我刚才在后台看到一个奇怪的弹幕。
ID是"项目编号07"。
这是公司内部账号吧？

[苏博士 → 小林] [02:45:40]
别管。继续录你的。

[老周 → 苏博士] [02:55:18]
它来了。和三年前一样的频率。
这次我们怎么办？

[苏博士 → 老周] [02:55:22]
按协议来。等信号够强就关直播。

[阿海 → (未发送)] [03:09:01]
"我签的合同到底是什么？
为什么他们要让我在直播到最危险的时候..."

[深渊号AI → 全体] [03:17:40]
协议07验收失败。
启动数据封存程序。
直播信号将在2秒后中断。
——感谢各位的参与。`,
    { command: 'grep -r "private_comm" /var/mail/', securityLevel: 'classified', attachedClue: 'crew_internal_comm' }
  ),
  mkTerminal(
    'term_contract',
    '阿海直播合同（扫描件OCR）',
    `合同编号：DS-LIVE-2047-0612-AH
甲方：深渊科技深海探索股份有限公司
乙方：海先生（艺名：阿海）

...

第17条 特殊条款

17.3 不可抗力条款之补充：
若直播过程中遭遇任何"不可抗力事件"
（包括但不限于设备故障、自然现象、
未分类深海生物接触等），乙方不可撤销地
授权甲方对全部直播素材进行任意形式的
剪辑、修改、重组、销毁或存档，
乙方及其继承人不得就此提出任何异议。

17.4 生物接触协议：
若直播过程中接触到被甲方归类为
"深海未知生物样本"的实体，
乙方同意作为"观测数据点"参与
甲方的非公开科学评估流程。

...

签署日期：2047年6月10日
签署地点：深渊科技马里亚纳基地B3层`,
    { command: 'find /encrypted_docs -name "*contract*" -exec strings {} \\;', securityLevel: 'classified', attachedClue: 'contract_clause_17' }
  ),
  mkTerminal(
    'term_project_dossier',
    '深渊项目档案（部分解密）',
    `项目代号：深渊之眼
项目负责人：苏XX（苏博士之父）
启动时间：2032年
状态：进行中

项目目标：
在马里亚纳海沟底部部署"验收装置"，
对定期下潜的船员进行行为评估，
筛选出符合条件的"观测者"。

验收标准：
[已解密] 1. 在压力环境下保持情绪稳定
[已解密] 2. 面对未知实体时不启动逃生程序
[机密]   3. █████████████████████
[机密]   4. █████████████████████

历史记录：
2035 — 第1次下潜，验收失败，4人
2038 — 第2次下潜，验收失败，3人
2041 — 第3次下潜，验收失败，5人
2044 — 第4次下潜，先驱者号，验收部分通过，1人生还
2047 — 第5次下潜，深渊号，评估中...

备注：
"观测者"候选人已在第5次下潜船员中确认。
直播是筛选流程的一部分，
观众的数据也将被纳入评估。`,
    { command: 'cat /archive/project_abyss_eye.md', securityLevel: 'classified', attachedClue: 'project_abyss_eye' }
  ),
  mkTerminal(
    'term_viewer_data',
    '直播观众行为分析报告',
    `报告生成时间：2047-06-12 03:18:01
直播ID：DEEP-2047-0612
峰值在线：2,847,291人

关键观众行为统计：
- 首次出现"关掉直播"弹幕：02:59:44
- 重复发送同样内容的观众ID：47个
- 登录IP来自深渊科技内网的观众：127个
- 在弹幕中提及"协议07"的观众：3个
- 在弹幕中提及"先驱者号"的观众：19个

特殊标记观众（内部代号）：
  * 深海知情人 — 行为模式：引导舆论
  * 项目编号07 — 行为模式：触发协议
  * 老周的儿子 — 行为模式：█死信号模拟█
  * 匿名用户0x7F — 行为模式：系统自检账号
  * 深渊号AI系统 — 行为模式：观测者

结论：
超过60%的"高互动观众"并非真实人类用户。
直播弹幕场已被算法操纵，
用于引导船员和真实观众的行为。

——深渊科技数据分析部
  （这份报告从未被任何人看过）`,
    { command: 'python3 analyze_viewers.py deep_sea_live.db', securityLevel: 'restricted', attachedClue: 'viewer_manipulation' }
  )
];

export const anonymousTriggers: AnonymousTrigger[] = [
  {
    id: 'trigger_email_intro',
    messageType: 'email',
    messageId: 'email_intro',
    triggerNodeId: 'start',
    triggerDialogueIndex: 6,
    delayMs: 1500
  },
  {
    id: 'trigger_term_system_log',
    messageType: 'terminal',
    messageId: 'term_system_log',
    triggerVariable: { key: 'intro_done', value: true },
    delayMs: 2000
  },
  {
    id: 'trigger_email_danmaku',
    messageType: 'email',
    messageId: 'email_danmaku_hint',
    triggerNodeId: 'analyze_danmaku',
    delayMs: 1000
  },
  {
    id: 'trigger_term_comm_log',
    messageType: 'terminal',
    messageId: 'term_comm_log',
    triggerNodeId: 'first_contact',
    triggerDialogueIndex: 6,
    delayMs: 1500
  },
  {
    id: 'trigger_email_protocol',
    messageType: 'email',
    messageId: 'email_protocol07',
    triggerVariable: { key: 'protocol_07', value: true },
    delayMs: 1200
  },
  {
    id: 'trigger_term_contract',
    messageType: 'terminal',
    messageId: 'term_contract',
    triggerVariable: { key: 'ahai_confession', value: true },
    delayMs: 1500
  },
  {
    id: 'trigger_email_creature',
    messageType: 'email',
    messageId: 'email_creature_truth',
    triggerVariable: { key: 'saw_creature', value: true },
    delayMs: 2000
  },
  {
    id: 'trigger_term_project',
    messageType: 'terminal',
    messageId: 'term_project_dossier',
    triggerVariable: { key: 'full_truth', value: true },
    delayMs: 1500
  },
  {
    id: 'trigger_email_loop',
    messageType: 'email',
    messageId: 'email_loop',
    memoryCondition: { playthroughAtLeast: 2 },
    triggerNodeId: 'start',
    delayMs: 3000
  },
  {
    id: 'trigger_term_viewer',
    messageType: 'terminal',
    messageId: 'term_viewer_data',
    memoryCondition: { playthroughAtLeast: 2 },
    triggerVariable: { key: 'clue_loop_awareness', value: true },
    delayMs: 2000
  }
];
