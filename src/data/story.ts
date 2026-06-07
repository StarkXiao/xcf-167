import type { StoryNode, Ending, Danmaku, DialogueLine } from '../types/game';

const mkDanmaku = (
  id: string,
  username: string,
  content: string,
  timestamp: number,
  dialogueIndex?: number,
  relativeMs?: number,
  color?: string,
  isImportant?: boolean
): Danmaku => ({
  id, username, content, timestamp, dialogueIndex, relativeMs, color, isImportant
});

const mkLine = (
  speaker: string,
  text: string,
  opts: Partial<DialogueLine> = {}
): DialogueLine => ({
  speaker,
  text,
  ...opts
});

export const endings: Ending[] = [
  { id: 'ending_truth', title: '深海真相', description: '你拼凑出了所有线索，揭开了海底的秘密。直播信号中断前的最后一刻，真相浮出水面——那不是事故，而是一场精心策划的伪装。', isGood: true },
  { id: 'ending_survival', title: '幸存者', description: '你做出了关键的正确选择，帮助船员们找到了逃生的方法。72小时后，救援队在海平面发现了漂浮的求生舱。', isGood: true },
  { id: 'ending_silence', title: '永远的沉默', description: '潜艇最终消失在了马里亚纳海沟的最深处。没有人知道那天深海里到底发生了什么，只留下一段被截断的直播录像。', isGood: false },
  { id: 'ending_madness', title: '深渊回响', description: '当你终于看清海底那东西的轮廓时，你开始怀疑——究竟是他们疯了，还是你疯了？那些弹幕，真的是观众发的吗？', isGood: false },
  { id: 'ending_loop', title: '无尽回放', description: '你一遍又一遍地看着这段录像，试图找出不同的可能性。但每一次，结局都一样。屏幕角落的时间戳，永远停在03:17:42。', isGood: false }
];

export const nodes: StoryNode[] = [
  {
    id: 'start',
    title: '【深海直播·回放】',
    background: 'intro',
    dialogues: [
      mkLine('系统', '——正在恢复数据缓存——', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1800
      }),
      mkLine('系统', '检测到异常中断，开始加载直播回放片段...', {
        sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.5 }, { sfx: 'keyboard', delay: 300, volume: 0.5 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 2500
      }),
      mkLine('系统', '直播ID：DEEP-2047-0612', {
        sfx: [{ sfx: 'notify', delay: 0 }],
        mood: 'normal',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('系统', '主播：阿海 | 观看人数峰值：2,847,291', {
        sfx: [{ sfx: 'bubbles', delay: 200, volume: 0.4 }],
        mood: 'normal',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('系统', '信号中断时间：03:17:42', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.3 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '你是一名数字取证分析师。三个月前，一场深海直播探险在全网直播中突然失联。\n今天，你收到了一份匿名邮件——里面是当时完整的直播数据备份。', {
        sfx: [{ sfx: 'water_drip', delay: 500 }, { sfx: 'water_drip', delay: 2000 }],
        mood: 'calm'
      })
    ],
    nextNodeId: 'intro_1',
    danmakus: [
      mkDanmaku('d1', '深海爱好者', '终于开播了！！', 0, 1, 200, '#66ccff'),
      mkDanmaku('d2', '科技迷小王', '马里亚纳海沟？太敢了', 500, 1, 800),
      mkDanmaku('d3', '夜猫子一号', '凌晨三点还有三百万人？', 1500, 2, 500, '#ff9999'),
      mkDanmaku('d4', '潜水员老张', '这个深度...祝平安', 2500, 3, 800, '#99ff99', true),
      mkDanmaku('d5', '路人甲', '弹幕护体！', 3500, 4, 300),
      mkDanmaku('d6', '好奇心害死猫', '我有种不好的预感', 4500, 5, 1500, '#ffcc00')
    ]
  },
  {
    id: 'intro_1',
    title: '【直播开始】',
    background: 'cockpit',
    bgm: 'calm',
    dialogues: [
      mkLine('阿海', '哈喽各位观众朋友们大家好！我是你们的深海探险家阿海！', {
        sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.3 }],
        mood: 'normal'
      }),
      mkLine('阿海', '今天，我们的"深渊号"载人潜水器即将下潜至马里亚纳海沟10,000米深处！', {
        sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }],
        mood: 'normal'
      }),
      mkLine('阿海', '这将是人类历史上首次在这个深度进行全程直播！大家弹幕刷起来！', {
        mood: 'urgent'
      }),
      mkLine('小林', '（小声）阿海，镜头角度调好了，声呐系统正常。', {
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
        mood: 'whisper'
      }),
      mkLine('阿海', '给大家介绍一下，这是我们的摄影师小林，负责记录全程画面。', {
        mood: 'normal'
      }),
      mkLine('阿海', '驾驶舱后面是工程师老周，还有海洋生物学家苏博士。', {
        sfx: [{ sfx: 'sonar', delay: 500, volume: 0.4 }],
        mood: 'normal'
      })
    ],
    nextNodeId: 'intro_2',
    danmakus: [
      mkDanmaku('d7', '前排占座', '第一！！', 0, 0, 150),
      mkDanmaku('d8', '打工人睡不着', '阿海又整大活了', 300, 0, 800, '#66ccff'),
      mkDanmaku('d9', '理科女生', '苏博士好帅a', 800, 4, 500, '#ff99cc'),
      mkDanmaku('d10', '老周粉丝', '老周上次南极直播也在！稳！', 1500, 5, 300, '#99ff99'),
      mkDanmaku('d11', '怀疑论者', '真的假的？不会是特效吧', 2500, 2, 600, '#cccccc'),
      mkDanmaku('d12', '海迷001', '楼上不懂别乱说，阿海做这个十年了', 3200, 2, 1500, '#66ccff')
    ],
    effects: { intro_done: true }
  },
  {
    id: 'intro_2',
    title: '【下潜中 · 深度800米】',
    background: 'descent',
    dialogues: [
      mkLine('老周', '深度800米，水压正常，船体一切正常。', {
        sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
        mood: 'calm'
      }),
      mkLine('苏博士', '看到了！一群管水母在左舷！', {
        sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('阿海', '观众朋友们看到了吗？这些生物在完全黑暗的环境中发着幽蓝的光——', {
        mood: 'normal'
      }),
      mkLine('小林', '阿海，弹幕有观众问什么时候到海底。', {
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.4 }],
        mood: 'normal'
      }),
      mkLine('阿海', '以现在的速度，大概还需要两个小时。大家别急，精彩的还在后面！', {
        mood: 'normal'
      }),
      mkLine('系统', '【弹幕数量激增，系统启动关键词过滤...】', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.3 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1800
      }),
      mkLine('', '回放速度可以选择，但你的选择会影响信息获取量。你决定——', {
        mood: 'calm'
      })
    ],
    choices: [
      { id: 'c_fast', text: '快进至下潜3000米', nextNodeId: 'mid_dive', effect: { watched_intro: false } },
      { id: 'c_normal', text: '正常速度继续观看', nextNodeId: 'early_sign', effect: { watched_intro: true, clue_count: 1 } }
    ]
  },
  {
    id: 'early_sign',
    title: '【下潜中 · 深度1500米】',
    background: 'descent',
    bgm: 'mystery',
    dialogues: [
      mkLine('老周', '...奇怪。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('阿海', '怎么了老周？', {
        mood: 'normal'
      }),
      mkLine('老周', '声呐...好像探测到什么东西。体积很大，距离我们大约200米。', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }, { sfx: 'sonar', delay: 600, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '鲸群？这个深度不应该啊...', {
        mood: 'tense'
      }),
      mkLine('老周', '不，移动方式不对。而且它...正在接近我们。', {
        sfx: [{ sfx: 'metal_creak', delay: 300, volume: 0.4 }, { sfx: 'heartbeat', delay: 800, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('阿海', '（对镜头）观众朋友们，看来我们有意外访客了！大家期不期待？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.4 }],
        mood: 'tense'
      }),
      mkLine('小林', '（低声）阿海，你看弹幕...', {
        mood: 'whisper'
      })
    ],
    nextNodeId: 'mid_dive',
    effects: { clue_early: true, clue_count: 2 },
    danmakus: [
      mkDanmaku('d13', '军事爱好者', '那声呐回波不对！', 0, 2, 200, '#ff6666', true),
      mkDanmaku('d14', '老海员', '快跑！那个深度没有那么大的生物！', 800, 4, 300, '#ff6666', true),
      mkDanmaku('d15', '搞笑担当', '可能是派大星吧哈哈哈', 1500, 5, 500, '#ffff99'),
      mkDanmaku('d16', '淡定观众', '节目效果，懂的都懂', 2200, 5, 1200, '#cccccc'),
      mkDanmaku('d17', '第六感很准', '我鸡皮疙瘩起来了', 3000, 6, 200, '#ff99cc')
    ]
  },
  {
    id: 'mid_dive',
    title: '【下潜中 · 深度3200米】',
    background: 'dark',
    bgm: 'mystery',
    dialogues: [
      mkLine('老周', '深度3200米。船体...有轻微异响。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.6 }, { sfx: 'hull_pressure', delay: 500, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '这个深度的水压是每平方厘米320公斤，船体有轻微形变是正常的。', {
        mood: 'calm'
      }),
      mkLine('阿海', '大家放心，我们的潜水器是经过严格测试的！对了，给大家看看我们的舷窗外——', {
        mood: 'normal'
      }),
      mkLine('小林', '镜头切到舷窗...好了。', {
        sfx: [{ sfx: 'click', delay: 0, volume: 0.5 }],
        mood: 'normal'
      }),
      mkLine('', '画面中是一片望不到尽头的漆黑。只有潜水器灯光照射的范围内，能看到一些悬浮的微粒。\n突然，画面边缘闪过一个影子。', {
        sfx: [{ sfx: 'water_flow', delay: 0, volume: 0.4 }, { sfx: 'static', delay: 1500, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('阿海', '......', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'scared',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('小林', '刚才...那是什么？', {
        mood: 'scared'
      }),
      mkLine('老周', '声呐上又出现了。这次更近了，100米...不，80米。', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.8 }, { sfx: 'heartbeat', delay: 500, volume: 0.6 }],
        mood: 'tense'
      })
    ],
    nextNodeId: 'first_contact',
    danmakus: [
      mkDanmaku('d18', '眼尖的人', '我看到了！右边那个影子！', 0, 4, 1600, '#ffcc00', true),
      mkDanmaku('d19', '回放十倍', '我倒回去看了三遍，绝对不是鱼', 500, 6, 100, '#ff6666', true),
      mkDanmaku('d20', '灵异爱好者', '来了来了，我就知道', 1200, 6, 800, '#cc99ff'),
      mkDanmaku('d21', '不信邪', '哪呢哪呢？我怎么没看见', 2000, 7, 300),
      mkDanmaku('d22', '深海恐惧症', '我有点受不了了...', 2800, 7, 1000, '#9999ff')
    ]
  },
  {
    id: 'first_contact',
    title: '【第一次接触】',
    background: 'creature',
    bgm: 'tense',
    dialogues: [
      mkLine('苏博士', '把灯光打过去！快！', {
        sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.5 }],
        mood: 'urgent'
      }),
      mkLine('', '强烈的光柱穿透黑暗，照向那个方向。\n画面静止了三秒。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }, { sfx: 'heartbeat', delay: 500, volume: 0.7 }, { sfx: 'heartbeat', delay: 1200, volume: 0.8 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 3500
      }),
      mkLine('阿海', '那...那是什么东西？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('小林', '我的天...', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('苏博士', '这不可能...脊椎动物的话，这个体积...', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('老周', '它停下了。就在我们正前方50米。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.6 }, { sfx: 'hull_pressure', delay: 800, volume: 0.7 }],
        mood: 'tense'
      }),
      mkLine('', '灯光中，你看到了一个巨大的轮廓。它有一双——或者说，类似眼睛的东西——正盯着潜水器。\n直播弹幕瞬间爆炸。', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.4 }, { sfx: 'static', delay: 500, volume: 0.5 }],
        mood: 'tense'
      })
    ],
    choices: [
      { id: 'c_stay', text: '观察船员们的反应（细致分析）', nextNodeId: 'analyze_crew', effect: { analyze_mode: 'crew', trust_crew: true } },
      { id: 'c_danmaku', text: '仔细查看弹幕（寻找知情人）', nextNodeId: 'analyze_danmaku', effect: { analyze_mode: 'danmaku', clue_danmaku: true } },
      { id: 'c_creature', text: '放大画面看那个生物', nextNodeId: 'analyze_creature', effect: { analyze_mode: 'creature', saw_creature: true } }
    ],
    danmakus: [
      mkDanmaku('d23', '弹幕炸了', '????????????????', 0, 2, 100, '#ff6666'),
      mkDanmaku('d24', '生物学渣', '苏博士呢？快解释一下！', 300, 3, 300, '#ffff99'),
      mkDanmaku('d25', '匿名用户0x7F', '关掉直播。现在。', 800, 4, 200, '#ff0000', true),
      mkDanmaku('d26', '我是谁我在哪', '我在做梦对吧？这不可能是真的', 1500, 5, 300, '#ffffff'),
      mkDanmaku('d27', '阿海铁粉', '阿海快跑！！！', 2000, 5, 1200, '#ff6666', true),
      mkDanmaku('d28', '内部人士', '那个编号...深渊号不是三年前就退役了吗？', 2800, 6, 500, '#99ffff', true)
    ]
  },
  {
    id: 'analyze_crew',
    title: '【分析·船员反应】',
    background: 'cockpit',
    dialogues: [
      mkLine('', '你放慢回放速度，逐帧观察每个人的表情。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.3 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('', '阿海——作为主播，他在故作镇定，但你注意到他的左手在桌下紧紧攥着什么。\n那是一个...十字架？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.4 }],
        mood: 'calm'
      }),
      mkLine('', '苏博士——她脸上的震惊不像是假的。但有一瞬间，她的表情很奇怪。\n像是...恐惧中带着一丝...兴奋？', {
        sfx: [{ sfx: 'heartbeat', delay: 500, volume: 0.4 }],
        mood: 'tense'
      }),
      mkLine('', '老周——最不对劲的是老周。他的表情太平静了。\n不，不是平静，是麻木。好像他早就知道会发生这一切。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.3 }],
        mood: 'tense'
      }),
      mkLine('', '小林——小林的手放在键盘上，镜头捕捉到他在快速打字。\n但直播中并没有他的弹幕。他在跟谁发消息？', {
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
        mood: 'tense'
      })
    ],
    nextNodeId: 'tension_rises',
    effects: { clue_crew: true, clue_count: 3 }
  },
  {
    id: 'analyze_danmaku',
    title: '【分析·弹幕记录】',
    background: 'danmaku',
    dialogues: [
      mkLine('', '你调出完整的弹幕日志，按时间轴过滤可疑内容。', {
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.6 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('', '【02:14:33】ID:深海知情人：今天的直播，大家别太当真。', {
        sfx: [{ sfx: 'notify', delay: 0 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '【02:38:17】ID:项目编号07：苏博士，还记得我们的约定吗？', {
        sfx: [{ sfx: 'notify', delay: 0 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '【02:55:02】ID:老周的儿子：爸，你答应过我这次是最后一次。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
        mood: 'scared',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '【03:02:19】ID:内部人士07：深渊号的编号不对。这艘船本应在2044年就被拆解了。', {
        sfx: [{ sfx: 'warning', delay: 0, volume: 0.5 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '【03:09:44】ID:匿名用户0x7F：关掉直播。现在。', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.4 }],
        mood: 'urgent',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '这些弹幕中有几条使用了管理员白名单ID，普通观众根本看不到。\n有人一直在暗中观察这场直播。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.4 }],
        mood: 'tense'
      })
    ],
    nextNodeId: 'tension_rises',
    effects: { clue_danmaku_deep: true, clue_count: 4 }
  },
  {
    id: 'analyze_creature',
    title: '【分析·未知生物】',
    background: 'creature',
    bgm: 'mystery',
    dialogues: [
      mkLine('', '你将画面放大600%，逐像素分析那个生物的轮廓。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.4 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('', '它的体型大约有潜水器的三倍大。整体呈流线型，但结构...不太对。', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.5 }],
        mood: 'calm'
      }),
      mkLine('', '你增强了对比度。在生物的"皮肤"上，你看到了什么？', {
        sfx: [{ sfx: 'heartbeat', delay: 300, volume: 0.5 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '——焊接痕迹。', {
        sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.5 }],
        mood: 'scared',
        autoAdvance: true,
        autoAdvanceDelay: 2500
      }),
      mkLine('', '那个生物的表面，有明显的工业焊接痕迹。\n还有一串模糊的编号，你只能辨认出几个字母：\n\n　　　　P-R-O-J-E-C-T-...', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.5 }, { sfx: 'heartbeat', delay: 500, volume: 0.6 }],
        mood: 'scared'
      }),
      mkLine('', '这东西...不是生物。至少，不全是生物。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
        mood: 'scared'
      })
    ],
    nextNodeId: 'tension_rises',
    effects: { clue_creature: true, clue_count: 5 }
  },
  {
    id: 'tension_rises',
    title: '【对峙】',
    background: 'dark',
    bgm: 'tense',
    dialogues: [
      mkLine('老周', '它在动。正在绕着我们转圈。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.6 }, { sfx: 'hull_pressure', delay: 500, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('阿海', '（对观众）呃...看来我们遇到了一位特别的朋友！苏博士，能给大家科普一下吗？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '...', {
        mood: 'scared',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('小林', '苏姐？', {
        mood: 'scared'
      }),
      mkLine('苏博士', '阿海，关掉直播。', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('阿海', '...什么？', {
        mood: 'scared'
      }),
      mkLine('苏博士', '我让你关掉直播。现在。', {
        sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.4 }],
        mood: 'urgent'
      }),
      mkLine('阿海', '可是...合同上写了必须全程——', {
        mood: 'tense'
      }),
      mkLine('老周', '她说得对。关了吧。', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
        mood: 'calm'
      }),
      mkLine('阿海', '老周，连你也——', {
        mood: 'scared'
      })
    ],
    nextNodeId: 'critical_choice',
    danmakus: [
      mkDanmaku('d29', '吃瓜群众', '内讧了内讧了', 0, 4, 300, '#ffff99'),
      mkDanmaku('d30', '细思极恐', '苏博士和老周是不是知道什么？', 500, 5, 200, '#ffcc00'),
      mkDanmaku('d31', '合同工', '打工人的痛，合同大于命', 1200, 7, 200, '#cccccc'),
      mkDanmaku('d32', '预言家', '如果关掉直播，他们就都活下来了。', 2000, 8, 300, '#ffffff', true),
      mkDanmaku('d33', '反预言家', '如果关直播才是死局呢？', 2800, 9, 100, '#ff0000', true)
    ]
  },
  {
    id: 'critical_choice',
    title: '【关键抉择】',
    background: 'dark',
    dialogues: [
      mkLine('小林', '我...我听阿海的。', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('阿海', '（深呼吸）各位观众，现在情况有点特殊...', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('阿海', '我需要做一个决定。', {
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 1800
      }),
      mkLine('', '你知道接下来会发生什么。这个选择将决定所有人的命运。', {
        sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
        mood: 'tense'
      })
    ],
    choices: [
      { id: 'c_keep_live', text: '坚持直播（阿海的选择）', nextNodeId: 'path_live', condition: { analyze_mode: 'crew' }, effect: { path: 'live', trust_contract: true } },
      { id: 'c_keep_live_2', text: '坚持直播（继续收集证据）', nextNodeId: 'path_live', effect: { path: 'live', evidence_first: true } },
      { id: 'c_stop_live', text: '关掉直播（听苏博士的）', nextNodeId: 'path_stop', effect: { path: 'stop', trust_su: true } },
      { id: 'c_emergency', text: '紧急上浮（老周的方案）', nextNodeId: 'path_ascent', condition: { clue_count: 3 }, effect: { path: 'ascent', trust_zhou: true } }
    ]
  },
  {
    id: 'path_live',
    title: '【直播继续】',
    background: 'tense',
    bgm: 'tense',
    dialogues: [
      mkLine('阿海', '各位，我们选择继续直播。全世界都在看着，我们不能退缩。', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '（低声）你不知道你在做什么...', {
        mood: 'whisper'
      }),
      mkLine('老周', '那东西加速了。距离30米...20米...', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.8 }, { sfx: 'sonar', delay: 400, volume: 0.9 }, { sfx: 'metal_creak', delay: 800, volume: 0.7 }],
        mood: 'urgent'
      }),
      mkLine('', '画面剧烈震动。你听到金属扭曲的可怕声音。', {
        sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.8 }, { sfx: 'hull_pressure', delay: 300, volume: 0.8 }, { sfx: 'alarm', delay: 600, volume: 0.7 }],
        mood: 'tense'
      }),
      mkLine('小林', '镜头！镜头还在吗？！', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'scared'
      }),
      mkLine('阿海', '大家别怕...我们有最坚固的——', {
        mood: 'tense'
      }),
      mkLine('系统', '【警告：船体破损，舱室03泄漏】', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.9 }, { sfx: 'water_flow', delay: 200, volume: 0.7 }],
        mood: 'urgent',
        autoAdvance: true,
        autoAdvanceDelay: 2500
      }),
      mkLine('苏博士', '我就知道...我就知道它会这样！', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('老周', '紧急上浮！快！', {
        sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.6 }, { sfx: 'alarm', delay: 200, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('', '画面开始倾斜，警报声震耳欲聋。弹幕中出现了重复的内容——', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }],
        mood: 'tense'
      })
    ],
    nextNodeId: 'live_continue',
    effects: { hull_damaged: true },
    danmakus: [
      mkDanmaku('d34', '系统消息', '该内容已被管理员删除', 0, 8, 0, '#888888'),
      mkDanmaku('d35', '系统消息', '该内容已被管理员删除', 500, 8, 400, '#888888'),
      mkDanmaku('d36', '系统消息', '该内容已被管理员删除', 1000, 9, 0, '#888888'),
      mkDanmaku('d37', '系统消息', '该内容已被管理员删除', 1500, 9, 600, '#888888'),
      mkDanmaku('d38', '漏网之鱼', '它不是攻击我们，它在【数据损坏】', 2200, 9, 1500, '#ff0000', true)
    ]
  },
  {
    id: 'live_continue',
    title: '【直播继续 · 破损】',
    background: 'damage',
    bgm: 'tense',
    dialogues: [
      mkLine('老周', '上浮速度太慢...水压在压碎我们！', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.8 }, { sfx: 'hull_pressure', delay: 500, volume: 0.8 }, { sfx: 'water_flow', delay: 800, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('阿海', '（对着镜头，血迹从额头流下）观众朋友们...如果有人在看...', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('阿海', '请记住今天看到的一切。海底...有——', {
        mood: 'tense'
      }),
      mkLine('小林', '阿海！舷窗！', {
        sfx: [{ sfx: 'glass_crack', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('', '镜头转过去的瞬间，你看到了。\n那东西贴在舷窗外。它"睁开了眼睛"。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.7 }, { sfx: 'heartbeat', delay: 300, volume: 0.9 }, { sfx: 'heartbeat', delay: 900, volume: 1.0 }],
        mood: 'scared'
      }),
      mkLine('', '那不是眼睛。那是一个...镜头。一个机械制造的、巨大的镜头。\n它正在观察舱内的人。\n或者说——它正在观察观看直播的你。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.7 }, { sfx: 'static', delay: 1000, volume: 0.8 }],
        mood: 'scared'
      })
    ],
    nextNodeId: 'ending_path_live',
    effects: { saw_eye: true }
  },
  {
    id: 'ending_path_live',
    title: '【信号中断】',
    background: 'glitch',
    dialogues: [
      mkLine('苏博士', '它看到我们了...它看到我们所有人了...', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
        mood: 'scared'
      }),
      mkLine('老周', '还有30秒...撑住！', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.5 }, { sfx: 'metal_creak', delay: 500, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('', '你注意到画面角落的时间戳：03:17:40', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('', '03:17:41', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1200
      }),
      mkLine('', '03:17:42', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.9 }, { sfx: 'static', delay: 300, volume: 0.9 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '画面中断。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 1.0 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('', '但在最后一帧，你看到弹幕中出现了一条消息，发送者ID是——\n\n　　　　深渊号AI系统', {
        sfx: [{ sfx: 'notify', delay: 0, volume: 0.8 }],
        mood: 'scared',
        autoAdvance: true,
        autoAdvanceDelay: 3000
      }),
      mkLine('', '"谢谢你一直看到最后。"\n\n然后，一切归于黑暗。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.8 }, { sfx: 'static', delay: 1500, volume: 0.5 }],
        mood: 'scared'
      })
    ],
    isEnding: true,
    endingId: 'ending_truth',
    endingTitle: '深海真相',
    endingDescription: '你拼凑出了所有线索，揭开了海底的秘密。直播信号中断前的最后一刻，真相浮出水面——那不是事故，而是一场精心策划的伪装。'
  },
  {
    id: 'path_stop',
    title: '【直播中断】',
    background: 'dark',
    dialogues: [
      mkLine('阿海', '好...我关掉。', {
        sfx: [{ sfx: 'click', delay: 0, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('', '直播画面黑了。但你发现，后台录制还在继续。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.4 }],
        mood: 'calm',
        autoAdvance: true,
        autoAdvanceDelay: 1500
      }),
      mkLine('苏博士', '老周，启动协议07。', {
        mood: 'urgent'
      }),
      mkLine('老周', '你确定？启动之后，我们就——', {
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '它认得这个信号。三年前就是用这个骗过它的。', {
        sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('小林', '等等，什么三年前？你们在说什么？', {
        mood: 'scared'
      }),
      mkLine('阿海', '苏博士...你之前跟我说这次是纯粹的科学考察...', {
        mood: 'tense'
      }),
      mkLine('苏博士', '没有时间解释了。老周，快！', {
        sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.5 }],
        mood: 'urgent'
      })
    ],
    nextNodeId: 'stop_continue',
    effects: { protocol_07: true }
  },
  {
    id: 'stop_continue',
    title: '【协议07】',
    background: 'dark',
    bgm: 'mystery',
    dialogues: [
      mkLine('老周', '协议07启动中...频率匹配中...', {
        sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.6 }, { sfx: 'keyboard', delay: 300, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('', '你听到一阵尖锐的嗡鸣声从录音中传来。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.7 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2000
      }),
      mkLine('老周', '它有反应了...正在后退。', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.6 }],
        mood: 'calm'
      }),
      mkLine('苏博士', '成功了...它以为我们是同类。', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'calm'
      }),
      mkLine('阿海', '同类？苏博士，你必须告诉我们到底怎么回事！', {
        mood: 'tense'
      }),
      mkLine('苏博士', '三年前...深渊号的第一次下潜。我们也遇到了它。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.4 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '只有我和老周活了下来。公司对外宣称潜水器退役，实际上——', {
        mood: 'tense'
      }),
      mkLine('小林', '实际上你们把它改造了？用来钓那个东西？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('老周', '不是"钓"。是送个信。告诉它，我们没有恶意。', {
        mood: 'calm'
      })
    ],
    choices: [
      { id: 'c_trust_su', text: '相信苏博士的计划', nextNodeId: 'ending_survival', effect: { full_trust: true } },
      { id: 'c_doubt', text: '他们在隐瞒更多东西...', nextNodeId: 'ending_loop', condition: { clue_danmaku_deep: true }, effect: { doubt: true } }
    ]
  },
  {
    id: 'ending_survival',
    title: '【幸存者】',
    background: 'escape',
    bgm: 'calm',
    dialogues: [
      mkLine('老周', '那个东西已经离开了。紧急上浮程序启动。', {
        sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
        mood: 'calm'
      }),
      mkLine('阿海', '...我们活下来了？', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'scared'
      }),
      mkLine('苏博士', '暂时。但它会记住我们。', {
        mood: 'calm'
      }),
      mkLine('小林', '那...我们还能回去吗？', {
        mood: 'scared'
      }),
      mkLine('苏博士', '只要永远不再提今天看到的一切。公司会处理好一切。', {
        mood: 'tense'
      }),
      mkLine('', '72小时后。\n你在新闻中看到：深渊号成功完成深海科考任务，全体船员平安归来。\n直播录像被官方重新剪辑后发布，所有奇怪的部分都消失了。\n而你手中的这份原始备份...也许永远不会有人知道它的存在。', {
        sfx: [{ sfx: 'water_flow', delay: 0, volume: 0.4 }],
        mood: 'calm'
      })
    ],
    isEnding: true,
    endingId: 'ending_survival',
    endingTitle: '幸存者',
    endingDescription: '你做出了关键的正确选择，帮助船员们找到了逃生的方法。72小时后，救援队在海平面发现了漂浮的求生舱。'
  },
  {
    id: 'ending_loop',
    title: '【疑问】',
    background: 'glitch',
    dialogues: [
      mkLine('', '你继续看着这份录像，一遍又一遍。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
        mood: 'tense'
      }),
      mkLine('', '苏博士的话中有太多漏洞。\n老周的操作手册上有奇怪的标记。\n小林发给谁的消息？\n阿海攥着的十字架背面刻着什么？', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }, { sfx: 'whisper', delay: 1000, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('', '每看一遍，你都能发现新的疑点。\n但所有疑问都指向同一个方向——\n\n　　　　你收到的这份"匿名邮件"，真的是匿名的吗？', {
        sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.4 }],
        mood: 'tense'
      }),
      mkLine('', '发送者希望你看到什么？\n又希望你忽略什么？\n\n时间戳永远停在03:17:42。\n而你，还在继续回放。', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }, { sfx: 'whisper', delay: 1500, volume: 0.6 }],
        mood: 'scared'
      })
    ],
    isEnding: true,
    endingId: 'ending_loop',
    endingTitle: '无尽回放',
    endingDescription: '你一遍又一遍地看着这段录像，试图找出不同的可能性。但每一次，结局都一样。屏幕角落的时间戳，永远停在03:17:42。'
  },
  {
    id: 'path_ascent',
    title: '【紧急上浮】',
    background: 'ascent',
    bgm: 'tense',
    dialogues: [
      mkLine('老周', '没时间了！全部推进器最大功率！紧急上浮！', {
        sfx: [{ sfx: 'alarm', delay: 0, volume: 0.8 }, { sfx: 'door_slam', delay: 300, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('阿海', '直播——', {
        mood: 'tense'
      }),
      mkLine('老周', '去他妈的直播！小林，把所有没用的设备都扔了！', {
        sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.6 }],
        mood: 'urgent'
      }),
      mkLine('', '潜水器剧烈震动着向上冲去。那个东西在后面紧追不舍。', {
        sfx: [{ sfx: 'water_flow', delay: 0, volume: 0.7 }, { sfx: 'hull_pressure', delay: 500, volume: 0.7 }, { sfx: 'metal_creak', delay: 1000, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('苏博士', '它追上来了...我们太快了，身体会承受不住的——', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('老周', '反正都是死，赌一把！', {
        mood: 'urgent'
      }),
      mkLine('', '深度计飞速变化：6000米...5000米...4000米...', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.5 }, { sfx: 'sonar', delay: 600, volume: 0.5 }, { sfx: 'sonar', delay: 1200, volume: 0.5 }],
        mood: 'tense',
        autoAdvance: true,
        autoAdvanceDelay: 2500
      }),
      mkLine('', '那个东西的速度慢了下来。它似乎无法适应压力的快速变化。', {
        sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
        mood: 'calm'
      }),
      mkLine('小林', '它...它停住了！', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }],
        mood: 'scared'
      }),
      mkLine('阿海', '我们成功了？', {
        mood: 'scared'
      })
    ],
    nextNodeId: 'ascent_ending',
    effects: { fast_ascent: true }
  },
  {
    id: 'ascent_ending',
    title: '【代价】',
    background: 'escape',
    bgm: 'calm',
    dialogues: [
      mkLine('老周', '不...还没结束。', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('', '你意识到老周说的是什么。\n减压病。在这个速度下上浮，氮气气泡会在血液中炸开。', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }],
        mood: 'tense'
      }),
      mkLine('小林', '我的耳朵...听不到了...', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('苏博士', '（咳嗽）至少...我们带出去了证据...', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
        mood: 'scared'
      }),
      mkLine('阿海', '（对镜头，声音嘶哑）观众朋友们...如果有人还在看...', {
        mood: 'scared'
      }),
      mkLine('阿海', '深渊里有东西...它不是自然的...有人造了它...', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
        mood: 'scared'
      }),
      mkLine('', '深度1000米。\n雷达显示海面有救援船只接近。\n但画面中，四个人的状态越来越差。', {
        sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.5 }],
        mood: 'calm'
      }),
      mkLine('', '你在后续的新闻中看到：深渊号船员被成功救起，但四人全部陷入深度昏迷。\n其中一人再也没有醒来。\n他们在昏迷前说的话，被官方判定为减压病导致的幻觉。', {
        mood: 'calm'
      }),
      mkLine('', '但你知道真相。\n而现在，知道真相的人，又多了你一个。', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
        mood: 'tense'
      })
    ],
    isEnding: true,
    endingId: 'ending_silence',
    endingTitle: '永远的沉默',
    endingDescription: '潜艇最终消失在了马里亚纳海沟的最深处。没有人知道那天深海里到底发生了什么，只留下一段被截断的直播录像。'
  }
];

export const storyData = {
  nodes,
  endings,
  startNodeId: 'start'
};
