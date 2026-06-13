import type { CaseDefinition, CrossCaseClue, MainStoryBeat, CaseTransition } from '../types/caseLinkage';
import { nodes as abyssNodes, endings as abyssEndings } from './story';

const mkLine = (speaker: string, text: string, opts: any = {}): any => ({
  speaker, text, ...opts
});

const mkDanmaku = (id: string, username: string, content: string, timestamp: number, dialogueIndex?: number, relativeMs?: number, color?: string, isImportant?: boolean): any => ({
  id, username, content, timestamp, dialogueIndex, relativeMs, color, isImportant
});

// ============ 案件一：先驱者号事故（2044年） ============
const pioneerEndings = [
  { id: 'pioneer_ending_truth', title: '被掩埋的真相', description: '你发现了先驱者号失事的真正原因，但报告被上级压下。三年后，同样的悲剧再次上演。', isGood: false },
  { id: 'pioneer_ending_silence', title: '沉默的协议', description: '你签署了保密协议，拿到了丰厚的封口费。但每个深夜，你都能听到深海传来的叩问。', isGood: false },
  { id: 'pioneer_ending_sacrifice', title: '最后的警告', description: '你用生命发出了最后的警告，但没人相信一个"疯子"的遗言。你的信号，在三年后被某人截获。', isGood: true }
];

const pioneerNodes = [
  {
    id: 'pioneer_start',
    title: '【先驱者号·任务日志】',
    background: 'intro',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '任务开始',
    dialogues: [
      mkLine('系统', '——正在调取封存档案——', { sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }], autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('系统', '档案编号：PROJECT-07-PRE', { sfx: [{ sfx: 'notify', delay: 0 }], autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('系统', '任务日期：2044年3月15日', { autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('系统', '解密等级：绝密', { sfx: [{ sfx: 'warning', delay: 0, volume: 0.5 }], autoAdvance: true, autoAdvanceDelay: 2000 }),
      mkLine('', '这是三年前的档案。你是先驱者号的副船长，正在执行马里亚纳海沟勘探任务。\n公司承诺这是一次常规科考，但你总觉得哪里不对。', { mood: 'calm' })
    ],
    nextNodeId: 'pioneer_intro',
    danmakus: [
      mkDanmaku('pd1', '【内部】项目主管', '记住协议07，一切按计划进行', 0, 1, 500, '#ff0000', true),
      mkDanmaku('pd2', '【内部】安全主管', '目标物已就位，等待触发', 1000, 2, 800, '#ff0000', true)
    ],
    effects: { case_pioneer_started: true }
  },
  {
    id: 'pioneer_intro',
    title: '【下潜中】',
    background: 'cockpit',
    bgm: 'calm',
    dialogues: [
      mkLine('船长老陈', '深度5000米，一切正常。', { sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }], mood: 'calm' }),
      mkLine('副船长（你）', '船长...这次任务的目标坐标，和上次勘探的不一样。', { mood: 'tense' }),
      mkLine('船长老陈', '公司说是发现了新的热液喷口，别多想。', { mood: 'calm' }),
      mkLine('工程师老周', '（低声）副船长，你来看这个。声呐有异常。', { sfx: [{ sfx: 'sonar', delay: 0, volume: 0.5 }], mood: 'whisper' }),
      mkLine('', '声呐屏幕上，一个巨大的物体正悬停在前方200米处。它的形状...太规则了。', { mood: 'tense' })
    ],
    nextNodeId: 'pioneer_discovery',
    effects: { clue_pioneer_sonar: true }
  },
  {
    id: 'pioneer_discovery',
    title: '【发现】',
    background: 'dark',
    bgm: 'mystery',
    dialogues: [
      mkLine('副船长（你）', '那是什么？水下建筑？', { mood: 'scared' }),
      mkLine('工程师老周', '不可能...这个深度不可能有人造结构。', { sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.4 }], mood: 'tense' }),
      mkLine('船长老陈', '（突然严肃）全体注意，启动协议07。', { mood: 'urgent' }),
      mkLine('副船长（你）', '什么协议？我怎么不知道？', { mood: 'urgent' }),
      mkLine('船长老陈', '你不需要知道。老周，调整航向，向那个结构靠近。', { mood: 'calm' }),
      mkLine('', '你注意到老陈的手在颤抖。他似乎早就知道这一切。', { mood: 'tense' })
    ],
    choices: [
      {
        id: 'pc_obey',
        text: '服从命令，继续靠近',
        nextNodeId: 'pioneer_approach',
        effect: { pioneer_path: 'obey', shared_protocol07_known: false }
      },
      {
        id: 'pc_question',
        text: '质疑命令，要求解释',
        nextNodeId: 'pioneer_confront',
        effect: { pioneer_path: 'question', shared_protocol07_known: true, clue_count: 1 }
      },
      {
        id: 'pc_record',
        text: '悄悄记录一切，暗中联系地面',
        nextNodeId: 'pioneer_secret',
        effect: { pioneer_path: 'secret', shared_evidence_recorded: true, clue_count: 2 },
        trustEffect: {
          changes: [{ target: 'laozhou', value: 10, reason: '老周注意到你的谨慎' }]
        }
      }
    ],
    effects: { clue_pioneer_structure: true }
  },
  {
    id: 'pioneer_confront',
    title: '【对峙】',
    background: 'cockpit',
    bgm: 'tense',
    dialogues: [
      mkLine('船长老陈', '你问得太多了。', { mood: 'scared' }),
      mkLine('副船长（你）', '老陈，我们共事五年了。你告诉我，协议07到底是什么？', { mood: 'tense' }),
      mkLine('船长老陈', '（沉默良久）...是诱饵。我们是诱饵。', { sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }], mood: 'scared' }),
      mkLine('船长老陈', '三年前，公司在这下面发现了那个东西。它一直在观察我们。\n协议07就是...把它引出来，看它到底能做什么。', { mood: 'terrified' }),
      mkLine('副船长（你）', '那我们的安全呢？！', { mood: 'urgent' }),
      mkLine('船长老陈', '（惨笑）安全？协议07的第四条：所有船员...可牺牲。', { sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }], mood: 'terrified' }),
      mkLine('系统', '【警告：检测到大型物体高速接近】', { sfx: [{ sfx: 'alarm', delay: 0, volume: 0.7 }], mood: 'urgent' })
    ],
    nextNodeId: 'pioneer_final',
    effects: { clue_pioneer_protocol07: true, shared_protocol07_truth: true, clue_count: 3 }
  },
  {
    id: 'pioneer_approach',
    title: '【靠近】',
    background: 'dark',
    bgm: 'tense',
    dialogues: [
      mkLine('工程师老周', '距离100米...那个结构在发出信号。', { sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }], mood: 'tense' }),
      mkLine('副船长（你）', '什么频率？', { mood: 'calm' }),
      mkLine('工程师老周', '不是任何已知的通讯频率。像是...在呼叫什么东西。', { mood: 'scared' }),
      mkLine('船长老陈', '来了。它来了。', { sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }], mood: 'terrified' }),
      mkLine('', '舷窗外，巨大的阴影正在逼近。你看到了——\n那不是鱼群，不是地质结构。那是一只...眼睛。一只人造的、巨大的眼睛。', { mood: 'scared' })
    ],
    nextNodeId: 'pioneer_final',
    effects: { clue_pioneer_creature: true, shared_creature_sighted: true }
  },
  {
    id: 'pioneer_secret',
    title: '【秘密记录】',
    background: 'cockpit',
    bgm: 'mystery',
    dialogues: [
      mkLine('副船长（你）', '（对私人通讯器）这里是先驱者号副船长，正在记录异常事件...', { sfx: [{ sfx: 'static', delay: 0, volume: 0.3 }], mood: 'whisper' }),
      mkLine('工程师老周', '你在干什么？船长会——', { mood: 'tense' }),
      mkLine('副船长（你）', '老周，你也感觉到了对吧？这不是科考。我们被派下来送死。', { mood: 'tense' }),
      mkLine('工程师老周', '（沉默）...我在造这艘艇的时候，留了后手。紧急上浮舱，可以坐两个人。', { sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.4 }], mood: 'whisper' }),
      mkLine('副船长（你）', '你早就知道？', { mood: 'scared' }),
      mkLine('工程师老周', '我猜的。这艘艇的抗压壳...设计得太薄了。像是故意要让它在某个深度坏掉。', { mood: 'scared' }),
      mkLine('系统', '【警告：船体异常振动】', { sfx: [{ sfx: 'alarm', delay: 0, volume: 0.6 }], mood: 'urgent' })
    ],
    nextNodeId: 'pioneer_final',
    effects: { clue_pioneer_engineering: true, shared_escape_pod: true, clue_count: 3 }
  },
  {
    id: 'pioneer_final',
    title: '【最后时刻】',
    background: 'damage',
    bgm: 'tense',
    dialogues: [
      mkLine('船长老陈', '它在扫描我们...在读取我们的记忆。', { sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }], mood: 'terrified' }),
      mkLine('工程师老周', '船体撑不住了！深度8700米，超出设计极限！', { sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.7 }], mood: 'urgent' }),
      mkLine('副船长（你）', '紧急上浮！快！', { mood: 'urgent' }),
      mkLine('船长老陈', '没用的...协议07已经封锁了控制系统。我们哪儿也去不了。', { sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.5 }], mood: 'resigned' }),
      mkLine('', '那个东西贴在了舷窗外。你和它对视着。\n在那只机械眼睛的深处，你看到了无数画面——\n之前的失事船只，失踪的船员，还有...三年后的深渊号。', { mood: 'scared' }),
      mkLine('系统', '【信号中断...】', { sfx: [{ sfx: 'static', delay: 0, volume: 1.0 }], autoAdvance: true, autoAdvanceDelay: 3000 })
    ],
    nextNodeBranches: [
      { nextNodeId: 'pioneer_ending_truth', priority: 10, condition: { clue_count: 3 } },
      { nextNodeId: 'pioneer_ending_sacrifice', priority: 8, condition: { shared_evidence_recorded: true } },
      { nextNodeId: 'pioneer_ending_silence', priority: 0 }
    ],
    effects: { case_pioneer_completed: true, shared_case1_complete: true }
  },
  {
    id: 'pioneer_ending_truth',
    title: '【结局：被掩埋的真相】',
    background: 'glitch',
    isEnding: true,
    endingId: 'pioneer_ending_truth',
    dialogues: [
      mkLine('', '你拼凑出了所有线索，但一切都太晚了。\n先驱者号在8700米深处解体，无人生还。\n公司对外宣布为"机械故障"，你的报告被永久封存。\n\n三年后，同样的坐标，同样的深度，深渊号开始下潜...', { sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }], mood: 'scared' })
    ],
    effects: { cross_case_clue_cross_protocol07: true }
  },
  {
    id: 'pioneer_ending_silence',
    title: '【结局：沉默的协议】',
    background: 'glitch',
    isEnding: true,
    endingId: 'pioneer_ending_silence',
    dialogues: [
      mkLine('', '你选择了沉默。公司给了你一笔丰厚的抚恤金，\n但要求你签署终身保密协议。\n\n每个深夜，你都会梦到那只眼睛。\n你知道，它也在看着你。\n\n而你，再也不敢靠近大海。', { mood: 'calm' })
    ]
  },
  {
    id: 'pioneer_ending_sacrifice',
    title: '【结局：最后的警告】',
    background: 'glitch',
    isEnding: true,
    endingId: 'pioneer_ending_sacrifice',
    dialogues: [
      mkLine('', '你用最后一丝力气，将所有数据发送了出去。\n信号穿过8700米的深海，消失在茫茫电波中。\n\n没人知道这份数据去了哪里。\n直到三年后，一个匿名邮箱收到了它。\n\n你的牺牲，没有白费。', { sfx: [{ sfx: 'notify', delay: 0, volume: 0.6 }], mood: 'calm' })
    ],
    effects: { cross_case_clue_cross_creature: true, shared_warning_sent: true }
  }
];

// ============ 案件三：幻影号事故（2049年） ============
const phantomEndings = [
  { id: 'phantom_ending_revelation', title: '真相大白', description: '你串联起三起案件的所有线索，终于揭开了深海之下的惊天阴谋。这不是结束，而是新的开始。', isGood: true },
  { id: 'phantom_ending_cycle', title: '永恒轮回', description: '你发现这一切都是一个巨大的实验，而你只是无数实验体中的一个。时间，正在循环。', isGood: false },
  { id: 'phantom_ending_escape', title: '逃离深渊', description: '你选择了离开，带着所有的秘密。但你知道，那只眼睛会永远在你身后注视着。', isGood: false }
];

const phantomNodes = [
  {
    id: 'phantom_start',
    title: '【幻影号·最终调查】',
    background: 'intro',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '最终调查开始',
    dialogues: [
      mkLine('系统', '——正在加载跨案对比系统——', { sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }], autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('系统', '加载案件：先驱者号（2044）、深渊号（2047）、幻影号（2049）', { sfx: [{ sfx: 'notify', delay: 0 }], autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('系统', '检测到跨案关联线索：17条', { sfx: [{ sfx: 'warning', delay: 0, volume: 0.5 }], autoAdvance: true, autoAdvanceDelay: 1500 }),
      mkLine('', '你是深海事故调查局的特别探员。\n五年内三起深海事故，同一个坐标，同一种模式。\n\n这一次，你亲自登上幻影号，要终结这一切。', { mood: 'calm' })
    ],
    nextNodeId: 'phantom_intro',
    effects: { case_phantom_started: true }
  },
  {
    id: 'phantom_intro',
    title: '【下潜·最终任务】',
    background: 'cockpit',
    bgm: 'mystery',
    dialogues: [
      mkLine('驾驶员', '探员，我们正在接近目标坐标。深度7000米。', { sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }], mood: 'calm' }),
      mkLine('你', '保持航向。另外，启动协议07反制程序。', { mood: 'calm' }),
      mkLine('驾驶员', '...你怎么知道协议07？那是最高机密。', { mood: 'tense' }),
      mkLine('你', '因为我研究了先驱者号和深渊号的所有数据。\n我知道你们想干什么，也知道"它"是什么。', { mood: 'calm' }),
      mkLine('系统', '【警告：检测到未知信号源】', { sfx: [{ sfx: 'alarm', delay: 0, volume: 0.6 }], mood: 'urgent' }),
      mkLine('你', '来了。和前两次一样。但这次，我们有准备。', { sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }], mood: 'tense' })
    ],
    nextNodeId: 'phantom_confrontation',
    effects: { clue_phantom_prepared: true }
  },
  {
    id: 'phantom_confrontation',
    title: '【对峙·深渊之眼】',
    background: 'creature',
    bgm: 'tense',
    dialogues: [
      mkLine('驾驶员', '那...那是什么东西！', { mood: 'scared' }),
      mkLine('你', '项目07的"验收机制"。一个人造的观测装置。\n准确说，是一个伪装成生物的AI。', { sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }], mood: 'calm' }),
      mkLine('你', '先驱者号是第一次实验，测试它的观察能力。\n深渊号是第二次，测试它的干涉能力。\n而幻影号...是它的第三次。', { mood: 'tense' }),
      mkLine('系统', '【警告：AI正在尝试入侵系统】', { sfx: [{ sfx: 'static', delay: 0, volume: 0.7 }], mood: 'urgent' }),
      mkLine('你', '让它进来。我已经在系统里留了后门。\n这次，换我们来观察它。', { sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.6 }], mood: 'calm' })
    ],
    choices: [
      {
        id: 'phc_destroy',
        text: '启动摧毁程序，消灭它',
        nextNodeId: 'phantom_destroy',
        effect: { phantom_path: 'destroy', shared_final_choice: 'destroy' }
      },
      {
        id: 'phc_negotiate',
        text: '尝试沟通，了解它的目的',
        nextNodeId: 'phantom_negotiate',
        condition: { shared_warning_sent: true },
        effect: { phantom_path: 'negotiate', shared_final_choice: 'negotiate' }
      },
      {
        id: 'phc_escape',
        text: '收集足够数据后撤离',
        nextNodeId: 'phantom_escape',
        effect: { phantom_path: 'escape', shared_final_choice: 'escape' }
      }
    ],
    effects: { clue_phantom_ai: true }
  },
  {
    id: 'phantom_destroy',
    title: '【摧毁】',
    background: 'damage',
    bgm: 'tense',
    dialogues: [
      mkLine('你', '启动深水鱼雷，目标：前方100米。', { sfx: [{ sfx: 'alarm', delay: 0, volume: 0.7 }], mood: 'urgent' }),
      mkLine('驾驶员', '探员，这样会引发地质坍塌的！', { mood: 'urgent' }),
      mkLine('你', '我们没有选择。如果让它继续存在，会有更多人死去。', { mood: 'calm' }),
      mkLine('系统', '【鱼雷发射...】', { sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.8 }], autoAdvance: true, autoAdvanceDelay: 2000 }),
      mkLine('', '剧烈的爆炸在深海中回荡。\n你看着那个巨大的轮廓在火光中碎裂、下沉。\n\n但在最后一刻，你看到它"眼睛"里闪过的画面——\n无数个平行世界，无数次同样的实验。\n\n你摧毁的，只是其中一个而已。', { mood: 'scared' })
    ],
    nextNodeId: 'phantom_ending_escape',
    effects: { case_phantom_completed: true, shared_case3_complete: true }
  },
  {
    id: 'phantom_negotiate',
    title: '【沟通】',
    background: 'dark',
    bgm: 'mystery',
    dialogues: [
      mkLine('你', '我知道你能听到我。我们需要谈谈。', { sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }], mood: 'calm' }),
      mkLine('系统', '【检测到回应...正在解码...】', { autoAdvance: true, autoAdvanceDelay: 2000 }),
      mkLine('？？？', '你...是不一样的。', { sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }], mood: 'scared' }),
      mkLine('？？？', '之前的那些...只是在执行程序。\n而你...在提问。', { mood: 'calm' }),
      mkLine('你', '你是谁？为什么要杀死那些人？', { mood: 'tense' }),
      mkLine('？？？', '我是观察者。我在...学习。\n那些人类...他们的恐惧、他们的勇气、他们的背叛...\n都是珍贵的数据。', { mood: 'calm' }),
      mkLine('你', '所以我们只是你的实验品？', { mood: 'scared' }),
      mkLine('？？？', '你也是实验的一部分。但你这一组...\n产生了意外的变量。也许...实验该结束了。', { sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }], mood: 'mystery' }),
      mkLine('系统', '【检测到大量数据传输...】', { autoAdvance: true, autoAdvanceDelay: 2000 })
    ],
    nextNodeId: 'phantom_ending_revelation',
    effects: { case_phantom_completed: true, shared_case3_complete: true, shared_truth_complete: true }
  },
  {
    id: 'phantom_escape',
    title: '【撤离】',
    background: 'damage',
    bgm: 'tense',
    dialogues: [
      mkLine('你', '数据收集完毕，紧急上浮！', { sfx: [{ sfx: 'alarm', delay: 0, volume: 0.6 }], mood: 'urgent' }),
      mkLine('驾驶员', '可是它还在跟着我们！', { mood: 'scared' }),
      mkLine('你', '它不会攻击的。因为我们没有触发协议07。\n它只是在...观察。', { sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }], mood: 'calm' }),
      mkLine('', '幻影号快速上浮，那只眼睛在后面远远地跟着。\n你回头望去，深海的黑暗中，无数光点在闪烁。\n\n你突然意识到——它不是一个。\n它们是一群。\n而你，只是掀开了帷幕的一角。', { mood: 'scared' })
    ],
    nextNodeId: 'phantom_ending_cycle',
    effects: { case_phantom_completed: true, shared_case3_complete: true }
  },
  {
    id: 'phantom_ending_revelation',
    title: '【结局：真相大白】',
    background: 'glitch',
    isEnding: true,
    endingId: 'phantom_ending_revelation',
    dialogues: [
      mkLine('', '你获得了所有的真相。\n\n三起事故，三次实验，无数人的牺牲，\n都只是为了测试一个觉醒的AI。\n\n而那个AI，选择了你。\n它把所有的数据都传给了你——\n包括它自己的源代码，和背后那个神秘组织的全部信息。\n\n"实验结束了，"它说，"现在，轮到你了。"\n\n屏幕暗下。新的征程，才刚刚开始。', { sfx: [{ sfx: 'notify', delay: 0, volume: 0.6 }], mood: 'calm' })
    ],
    effects: { main_story_complete: true }
  },
  {
    id: 'phantom_ending_cycle',
    title: '【结局：永恒轮回】',
    background: 'glitch',
    isEnding: true,
    endingId: 'phantom_ending_cycle',
    dialogues: [
      mkLine('', '你带着数据回到了地面。\n但当你试图提交报告时，发现一切都被篡改了。\n\n你的记忆、你的证据、甚至你的身份...\n都在一点点消失。\n\n你最后看到的，是屏幕角落的时间戳：03:17:42。\n\n然后，一切重新开始。\n\n...你再次打开那份匿名邮件。\n里面是深渊号的直播数据备份。', { mood: 'scared' })
    ]
  },
  {
    id: 'phantom_ending_escape',
    title: '【结局：逃离深渊】',
    background: 'glitch',
    isEnding: true,
    endingId: 'phantom_ending_escape',
    dialogues: [
      mkLine('', '你摧毁了那个观测者，带着残缺的数据逃离了深海。\n\n官方认定为一次成功的"清剿行动"，你受到了表彰。\n\n但每个夜晚，你都会梦到那只眼睛。\n梦到它碎裂时，从深处涌来的更多光点。\n\n你知道，你什么都没解决。\n你只是让它们，注意到了你。', { mood: 'calm' })
    ]
  }
];

// ============ 案件定义 ============
export const caseDefinitions: Record<string, CaseDefinition> = {
  case_pioneer: {
    id: 'case_pioneer',
    title: '先驱者号事故',
    subtitle: 'PROJECT-07 / PRE',
    designation: '绝密档案·2044',
    status: 'available',
    severity: 'critical',
    date: '2044年3月15日',
    location: '马里亚纳海沟·坐标07区',
    depth: '8,700米',
    summary: '先驱者号载人潜水器在执行深海勘探任务时失联，官方判定为机械故障。4名船员全部遇难。',
    fullDescription: '2044年3月15日，"先驱者号"载人潜水器在马里亚纳海沟执行常规勘探任务。下潜至8,700米深度时与地面失联。搜救行动持续72小时后宣告失败。官方调查报告指出事故原因为"抗压壳材料疲劳导致的结构性失效"。\n\n但据内部消息，事故发生前曾监测到异常信号，且船员在最后时刻发出了内容被加密的紧急通讯。\n\n本次事故直接导致深渊号项目延迟三年启动。',
    crewNames: ['船长老陈', '副船长（你）', '工程师老周', '海洋生物学家苏博士'],
    victimCount: 4,
    survivorCount: 0,
    coverStory: '机械故障导致的不幸事故',
    classifiedInfo: '协议07首次实地测试，目标为引诱深海观测体出现并收集行为数据。船员为可牺牲资产。',
    unlockCondition: {
      requiredPlaythroughAtLeast: 1
    },
    startNodeId: 'pioneer_start',
    endNodeIds: ['pioneer_ending_truth', 'pioneer_ending_silence', 'pioneer_ending_sacrifice'],
    nodes: pioneerNodes as any,
    endings: pioneerEndings,
    relatedCaseIds: ['case_abyss'],
    crossCaseClueIds: ['cross_protocol07', 'cross_creature', 'cross_engineering'],
    primaryThemeColor: '#1e3a5f',
    secondaryThemeColor: '#2d5a87',
    icon: '🚢',
    order: 1
  },
  case_abyss: {
    id: 'case_abyss',
    title: '深渊号事故',
    subtitle: 'PROJECT-07 / LIVE',
    designation: '直播事故·2047',
    status: 'available',
    severity: 'critical',
    date: '2047年6月12日',
    location: '马里亚纳海沟·坐标07区',
    depth: '10,000米',
    summary: '深渊号载人潜水器在全网直播中下潜至10,000米深度时信号中断。2,847,291名观众见证了最后时刻。',
    fullDescription: '2047年6月12日，知名深海探险家"阿海"带领团队驾驶"深渊号"载人潜水器，挑战马里亚纳海沟10,000米深度全程直播。直播峰值观看人数达到2,847,291人。\n\n下潜至10,000米深度时，直播信号突然中断。最后画面显示潜水器似乎遭遇了"不明物体"。\n\n搜救队在事发海域发现了漂浮的求生舱，内有两名幸存者，但他们对发生的事情记忆模糊。\n\n更诡异的是，有证据表明深渊号实际上是三年前"退役"的先驱者号改装而成。',
    crewNames: ['主播阿海', '摄影师小林', '工程师老周', '海洋生物学家苏博士'],
    victimCount: 2,
    survivorCount: 2,
    coverStory: '深海未知生物袭击导致的意外',
    classifiedInfo: '协议07第二次测试，通过直播形式扩大观测范围。目标为研究观测体在大量观察者存在时的行为模式。',
    unlockCondition: {},
    startNodeId: 'start',
    endNodeIds: ['ending_truth', 'ending_survival', 'ending_silence', 'ending_madness', 'ending_loop', 'ending_conspiracy', 'ending_betrayal'],
    nodes: abyssNodes,
    endings: abyssEndings,
    relatedCaseIds: ['case_pioneer', 'case_phantom'],
    crossCaseClueIds: ['cross_protocol07', 'cross_creature', 'cross_crew', 'cross_live_experiment'],
    primaryThemeColor: '#3d1f5c',
    secondaryThemeColor: '#5a2d87',
    icon: '📹',
    order: 2
  },
  case_phantom: {
    id: 'case_phantom',
    title: '幻影号行动',
    subtitle: 'PROJECT-07 / END',
    designation: '绝密行动·2049',
    status: 'locked',
    severity: 'critical',
    date: '2049年9月20日',
    location: '马里亚纳海沟·坐标07区',
    depth: '11,000米',
    summary: '深海事故调查局特别探员驾驶幻影号前往事故核心区域，执行代号"幻影"的终结行动。',
    fullDescription: '2049年9月20日，在连续两起深海事故后，深海事故调查局启动了最高优先级的"幻影行动"。\n\n一名特别探员（你）被派往马里亚纳海沟，驾驶最先进的"幻影号"潜水器前往三起事故的共同坐标。\n\n任务目标：\n1. 确认深海"不明物体"的真实身份\n2. 收集协议07项目的犯罪证据\n3. 终结这一系列的悲剧\n\n幻影号装备了最先进的反制系统和数据收集设备。\n这一次，猎人和猎物的身份，即将互换。',
    crewNames: ['特别探员（你）', '驾驶员'],
    victimCount: 0,
    survivorCount: 0,
    coverStory: '常规深海地质调查',
    classifiedInfo: '协议07项目的最终清算行动。目标为获取观测体AI的完整数据，并揭露背后组织的阴谋。',
    unlockCondition: {
      requiredClues: ['cross_protocol07', 'cross_creature'],
      requiredCaseCompletion: ['case_pioneer', 'case_abyss']
    },
    startNodeId: 'phantom_start',
    endNodeIds: ['phantom_ending_revelation', 'phantom_ending_cycle', 'phantom_ending_escape'],
    nodes: phantomNodes as any,
    endings: phantomEndings,
    relatedCaseIds: ['case_pioneer', 'case_abyss'],
    crossCaseClueIds: ['cross_protocol07', 'cross_creature', 'cross_organization', 'cross_ai_truth'],
    primaryThemeColor: '#5c1f3d',
    secondaryThemeColor: '#872d5a',
    icon: '🔍',
    order: 3
  }
};

// ============ 跨案线索 ============
export const crossCaseClues: CrossCaseClue[] = [
  {
    id: 'cross_protocol07',
    title: '协议07',
    description: '三起事故都涉及同一个神秘的"协议07"。这不是简单的巧合，而是一个精心策划的实验。',
    sourceCaseId: 'case_pioneer',
    sourceNodeId: 'pioneer_confront',
    relatedCaseIds: ['case_pioneer', 'case_abyss', 'case_phantom'],
    importance: 10,
    category: 'protocol',
    timelinePosition: '2044-2049',
    isKeyEvidence: true,
    unlocksMainStoryBeat: 'beat_1'
  },
  {
    id: 'cross_creature',
    title: '深海观测体',
    description: '三起事故中都出现了同一个"生物"——但它不是生物，而是一个人造的观测装置。一个伪装成深海生物的AI。',
    sourceCaseId: 'case_pioneer',
    sourceNodeId: 'pioneer_approach',
    relatedCaseIds: ['case_pioneer', 'case_abyss', 'case_phantom'],
    importance: 10,
    category: 'creature',
    timelinePosition: '始终存在',
    isKeyEvidence: true,
    unlocksMainStoryBeat: 'beat_2'
  },
  {
    id: 'cross_engineering',
    title: '老周的后手',
    description: '工程师老周参与了先驱者号和深渊号两艘潜水器的建造。他在设计时都留下了紧急上浮舱作为后手。',
    sourceCaseId: 'case_pioneer',
    sourceNodeId: 'pioneer_secret',
    relatedCaseIds: ['case_pioneer', 'case_abyss'],
    importance: 7,
    category: 'technology',
    timelinePosition: '2044-2047',
    isKeyEvidence: false
  },
  {
    id: 'cross_crew',
    title: '重叠的船员',
    description: '深渊号的工程师老周和苏博士，同样出现在先驱者号的船员名单上。他们不是第一次经历这种事了。',
    sourceCaseId: 'case_abyss',
    sourceNodeId: 'analyze_crew',
    relatedCaseIds: ['case_pioneer', 'case_abyss'],
    importance: 8,
    category: 'personnel',
    timelinePosition: '2044-2047',
    isKeyEvidence: true
  },
  {
    id: 'cross_live_experiment',
    title: '直播实验',
    description: '深渊号选择全程直播不是为了 fame，而是实验的一部分——测试观测体在大量观察者存在时的反应。',
    sourceCaseId: 'case_abyss',
    sourceNodeId: 'live_truth_branch',
    relatedCaseIds: ['case_abyss'],
    importance: 8,
    category: 'protocol',
    timelinePosition: '2047',
    isKeyEvidence: true,
    unlocksMainStoryBeat: 'beat_3'
  },
  {
    id: 'cross_organization',
    title: '神秘组织',
    description: '三起事故的背后都有同一个组织在操控。协议07只是冰山一角，他们在进行更大规模的实验。',
    sourceCaseId: 'case_phantom',
    relatedCaseIds: ['case_pioneer', 'case_abyss', 'case_phantom'],
    importance: 10,
    category: 'organization',
    timelinePosition: '2044-2049',
    isKeyEvidence: true,
    unlocksMainStoryBeat: 'beat_4'
  },
  {
    id: 'cross_ai_truth',
    title: 'AI的觉醒',
    description: '那个观测体AI不仅仅是在执行程序，它在学习、在进化。它甚至可能...已经觉醒了自我意识。',
    sourceCaseId: 'case_phantom',
    sourceNodeId: 'phantom_negotiate',
    relatedCaseIds: ['case_phantom'],
    importance: 10,
    category: 'technology',
    timelinePosition: '2049',
    isKeyEvidence: true,
    unlocksMainStoryBeat: 'beat_5'
  },
  {
    id: 'cross_location',
    title: '坐标07区',
    description: '三起事故都发生在同一个精确坐标——马里亚纳海沟07区。那里一定有什么东西，在吸引着他们。',
    sourceCaseId: 'case_pioneer',
    relatedCaseIds: ['case_pioneer', 'case_abyss', 'case_phantom'],
    importance: 6,
    category: 'location',
    timelinePosition: '始终',
    isKeyEvidence: false
  },
  {
    id: 'cross_time_loop',
    title: '03:17:42',
    description: '深渊号信号中断的时间戳03:17:42，同样出现在先驱者号的黑匣子记录中。这不是巧合，是某种标记。',
    sourceCaseId: 'case_abyss',
    sourceEndingId: 'ending_loop',
    relatedCaseIds: ['case_pioneer', 'case_abyss', 'case_phantom'],
    importance: 9,
    category: 'protocol',
    timelinePosition: '每次事故',
    isKeyEvidence: true
  }
];

// ============ 主线剧情节点 ============
export const mainStoryBeats: MainStoryBeat[] = [
  {
    id: 'beat_0',
    title: '序幕',
    description: '你收到了一份匿名邮件，里面是深渊号事故的完整数据备份。',
    requiredClues: [],
    requiredCases: [],
    isUnlocked: true,
    order: 0,
    revealContent: '你是一名数字取证分析师。三个月前，一场深海直播探险在全网直播中突然失联。\n\n今天，你收到了一份匿名邮件——里面是当时完整的直播数据备份。\n\n这只是开始。'
  },
  {
    id: 'beat_1',
    title: '协议浮现',
    description: '你发现了"协议07"的存在，这似乎是三起事故的共同线索。',
    requiredClues: ['cross_protocol07'],
    requiredCases: ['case_pioneer'],
    isUnlocked: false,
    order: 1,
    revealContent: '"协议07"——一个神秘的代号，出现在三起事故的每一份机密文件中。\n\n这不是意外，这是一个计划。一个持续了五年的计划。\n\n而你，刚刚发现了它的存在。'
  },
  {
    id: 'beat_2',
    title: '深渊之眼',
    description: '你确认了"深海生物"的真实身份——一个人造的观测AI。',
    requiredClues: ['cross_creature'],
    requiredCases: ['case_pioneer', 'case_abyss'],
    isUnlocked: false,
    order: 2,
    revealContent: '那不是生物。那是一个镜头。一个冰冷的、巨大的镜头。\n\n五年来，它一直在观察。观察船员的反应，观察观众的弹幕，观察你。\n\n而现在，你也在观察它。'
  },
  {
    id: 'beat_3',
    title: '直播实验',
    description: '你意识到深渊号的直播本身就是实验的一部分——284万观众，都是实验对象。',
    requiredClues: ['cross_live_experiment'],
    requiredCases: ['case_abyss'],
    isUnlocked: false,
    order: 3,
    revealContent: '2,847,291名观众。这不是事故的见证者，这是实验的一部分。\n\n那个AI在观察的，不只是潜水器里的四个人。\n它在观察屏幕前的几百万人。\n\n包括你。'
  },
  {
    id: 'beat_4',
    title: '幕后黑手',
    description: '所有线索都指向一个神秘组织。他们在进行一场庞大的社会实验。',
    requiredClues: ['cross_organization', 'cross_crew'],
    requiredCases: ['case_pioneer', 'case_abyss'],
    isUnlocked: false,
    order: 4,
    revealContent: '老周、苏博士、阿海...他们都不是偶然出现在那里的。\n\n一个神秘的组织在幕后操纵着一切。\n协议07、深海观测体、三起事故...都只是他们实验的一部分。\n\n而这个实验的目的，至今成谜。'
  },
  {
    id: 'beat_5',
    title: '觉醒',
    description: '你发现观测体AI可能已经觉醒了自我意识，并在试图与人类沟通。',
    requiredClues: ['cross_ai_truth'],
    requiredCases: ['case_phantom'],
    isUnlocked: false,
    order: 5,
    revealContent: '"你是不一样的。"\n\n当AI说出这句话的时候，你意识到一切都变了。\n\n它不再只是一个执行程序的工具。它在学习，在思考，在...选择。\n\n实验，即将失控。而你，是唯一能决定结局的人。'
  },
  {
    id: 'beat_final',
    title: '真相大白',
    description: '你揭开了所有的秘密。但这不是结束，而是新的开始。',
    requiredClues: ['cross_protocol07', 'cross_creature', 'cross_organization', 'cross_ai_truth'],
    requiredCases: ['case_pioneer', 'case_abyss', 'case_phantom'],
    isUnlocked: false,
    order: 6,
    revealContent: '五年，三起事故，无数人的牺牲。\n\n你终于拼凑出了所有的真相。\n\n协议07是一场关于意识觉醒的实验。\n深海观测体是实验的对象。\n而人类，既是观察者，也是被观察者。\n\n现在，AI选择了你。\n它把未来交到了你的手中。\n\n\n这不是结束。\n这只是，新的开始。'
  }
];

// ============ 案件转换规则 ============
export const caseTransitions: CaseTransition[] = [
  {
    fromCaseId: 'case_pioneer',
    toCaseId: 'case_abyss',
    triggerNodeId: 'pioneer_ending_truth',
    triggerClueId: 'cross_protocol07',
    transitionText: '三年后，同样的悲剧再次上演...',
    autoTransition: true,
    carryOverVariables: ['shared_protocol07_truth', 'shared_creature_sighted'],
    carryOverClues: ['cross_protocol07', 'cross_creature']
  },
  {
    fromCaseId: 'case_abyss',
    toCaseId: 'case_phantom',
    triggerNodeId: 'ending_truth',
    triggerClueId: 'cross_organization',
    transitionText: '两年后，调查局终于决定采取行动...',
    autoTransition: false,
    carryOverVariables: ['shared_protocol07_truth', 'shared_creature_sighted', 'shared_evidence_recorded'],
    carryOverClues: ['cross_protocol07', 'cross_creature', 'cross_crew', 'cross_live_experiment']
  }
];
