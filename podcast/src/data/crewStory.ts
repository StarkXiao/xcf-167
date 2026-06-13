import type {
  CrewStoryNode,
  CrewEnding,
  CrewDanmaku,
  CrewInnerThought,
  CrewChoice,
  CrewMemberId,
  DialogueLine
} from '../types/game';

const mkLine = (
  speaker: string,
  text: string,
  opts: Partial<DialogueLine> = {}
): DialogueLine => ({
  speaker,
  text,
  ...opts
});

const mkCrewDanmaku = (
  id: string,
  username: string,
  content: string,
  timestamp: number,
  sourcePerspective: CrewMemberId,
  opts: Partial<CrewDanmaku> = {}
): CrewDanmaku => ({
  id,
  username,
  content,
  timestamp,
  sourcePerspective,
  isInnerThought: false,
  isPrivateChat: false,
  color: '#ffffff',
  ...opts
});

const mkInnerThought = (
  perspectiveId: CrewMemberId,
  text: string,
  thoughtDepth: 'surface' | 'deep' | 'suppressed' = 'surface',
  opts: Partial<CrewInnerThought> = {}
): CrewInnerThought => ({
  perspectiveId,
  speaker: `【内心】${{
    ahai: '阿海',
    xiaolin: '小林',
    laozhou: '老周',
    suboshi: '苏博士'
  }[perspectiveId]}`,
  text,
  thoughtDepth,
  mood: 'whisper',
  ...opts
});

export const crewEndings: CrewEnding[] = [
  {
    id: 'crew_ending_all_survive_truth',
    title: '【全员生还·真相线】',
    description: '四人全部浮出海面。在减压舱里，他们约定永远不说出海底的真相。但苏博士偷偷将一份数据备份，藏进了小林的相机存储卡里。',
    isGood: true,
    survivorIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    casualtyIds: [],
    perspectiveId: 'suboshi',
    crossedEndingIds: ['ending_truth', 'ending_survival'],
    truthRevealed: true,
    crewFate: {
      ahai: '放弃了直播行业，开了一家海边小酒馆。',
      xiaolin: '成为自由摄影师，再也不拍深海。',
      laozhou: '退休后和儿子住在一起，床头永远放着那本操作手册。',
      suboshi: '辞去了研究所的工作，每年匿名给海洋保护组织捐款。'
    }
  },
  {
    id: 'crew_ending_zhou_sacrifice',
    title: '【老周的选择·牺牲线】',
    description: '老周留在主艇体操作协议07，为其他三人争取上浮时间。紧急上浮舱冲出海面的那一刻，深海里传来一声沉闷的金属共鸣。',
    isGood: false,
    survivorIds: ['ahai', 'xiaolin', 'suboshi'],
    casualtyIds: ['laozhou'],
    perspectiveId: 'laozhou',
    crossedEndingIds: ['ending_survival', 'ending_silence'],
    truthRevealed: false,
    crewFate: {
      ahai: '再也没有出过海，成了一名公益反潜水倡导者。',
      xiaolin: '将老周的照片洗出来，放在自己的摄影展最中心。',
      laozhou: '他的操作手册和那串钥匙，永远留在了马里亚纳海沟。',
      suboshi: '在之后的三年里，每个周末都去老周儿子家做饭。'
    }
  },
  {
    id: 'crew_ending_suboshi_stays',
    title: '【苏博士的抉择·留下线】',
    description: '苏博士选择留下来和"它"对话。当其他人浮出海面时，她终于听懂了那阵嗡鸣——不是攻击，是求救。',
    isGood: false,
    survivorIds: ['ahai', 'xiaolin', 'laozhou'],
    casualtyIds: ['suboshi'],
    perspectiveId: 'suboshi',
    crossedEndingIds: ['ending_truth', 'ending_madness'],
    truthRevealed: true,
    crewFate: {
      ahai: '用余生讲述苏博士的故事，尽管没人相信。',
      xiaolin: '保存了苏博士最后一张照片，从未示人。',
      laozhou: '每年下潜一次，在3000米深度放出一束玫瑰。',
      suboshi: '有人说在深海声呐记录里，还能听到她的声音频率。'
    }
  },
  {
    id: 'crew_ending_xiaolin_breaks',
    title: '【小林的崩溃·疯狂线】',
    description: '小林再也承受不住三年前和现在的双重记忆，她砸毁了所有摄像设备。当救援人员找到他们时，她只反复说着一句话："它在镜头里看着我们。"',
    isGood: false,
    survivorIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    casualtyIds: [],
    perspectiveId: 'xiaolin',
    crossedEndingIds: ['ending_madness', 'ending_survival'],
    truthRevealed: false,
    crewFate: {
      ahai: '卖掉了所有设备，陪小林接受治疗。',
      xiaolin: '再也没有拿起过相机，她的世界里再也没有蓝色。',
      laozhou: '把小林当年那台被砸毁的相机修好，放在自己的工具箱最底层。',
      suboshi: '将所有研究资料封存，在论文结尾写了一句：有些问题，不该被问。'
    }
  },
  {
    id: 'crew_ending_ahai_confession',
    title: '【阿海的告白·救赎线】',
    description: '阿海在镜头前坦白了一切——合同、协议07、公司的阴谋。直播信号被切断前的最后一秒，他的十字架从衣领中滑落。背面刻着：「愿真相比生命更重」。',
    isGood: true,
    survivorIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    casualtyIds: [],
    perspectiveId: 'ahai',
    crossedEndingIds: ['ending_truth', 'ending_survival'],
    truthRevealed: true,
    crewFate: {
      ahai: '因揭露公司丑闻被行业封杀，但他的那段直播成为了互联网的传说。',
      xiaolin: '成为调查记者，专门拍摄海洋污染和企业黑幕。',
      laozhou: '作为证人出庭，他的证词让三家上市公司破产。',
      suboshi: '成立了独立海洋研究实验室，不再接受任何企业资助。'
    }
  },
  {
    id: 'crew_ending_mutual_betrayal',
    title: '【互相背叛·毁灭线】',
    description: '在高压和恐惧之下，四人开始互相指责、揭发彼此的秘密。潜水器里的内讧比外面的怪物更可怕。当救援到达时，舱门打开的瞬间，只看到四双互不信任的眼睛。',
    isGood: false,
    survivorIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    casualtyIds: [],
    perspectiveId: 'ahai',
    crossedEndingIds: ['ending_loop', 'ending_madness'],
    truthRevealed: true,
    crewFate: {
      ahai: '四人再也没有见过面。',
      xiaolin: '四人再也没有见过面。',
      laozhou: '四人再也没有见过面。',
      suboshi: '四人再也没有见过面。'
    }
  },
  {
    id: 'crew_ending_zhou_secret_saved',
    title: '【老周的后手·完美逃脱线】',
    description: '老周从第三舱段拉出那台他十年前就藏好的独立发射器。当所有人都以为死定了的时候，他用那台老机器发出了一个频率——那是他当年和"它"定下的约定。',
    isGood: true,
    survivorIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    casualtyIds: [],
    perspectiveId: 'laozhou',
    crossedEndingIds: ['ending_survival', 'ending_truth'],
    truthRevealed: false,
    crewFate: {
      ahai: '继续做直播，但每一期结尾都会说一句：对自然保持敬畏。',
      xiaolin: '和小林结婚了。婚礼上，老周送了一台全新的相机。',
      laozhou: '他的工具箱里，永远留着一个空位——给那台他永远不会再提起的发射器。',
      suboshi: '经常深夜给老周打电话，讨论一些"假设性"的海洋生物学问题。'
    }
  },
  {
    id: 'crew_ending_all_lost',
    title: '【全员失联·深渊线】',
    description: '没有人逃出来。官方记录是"机械故障导致的意外事故"。但在后来的三年里，全球各地的深海声呐站，都间歇性地接收到了一段规律的信号——四个心跳的频率，重叠在一起。',
    isGood: false,
    survivorIds: [],
    casualtyIds: ['ahai', 'xiaolin', 'laozhou', 'suboshi'],
    perspectiveId: 'xiaolin',
    crossedEndingIds: ['ending_silence', 'ending_madness'],
    truthRevealed: false,
    crewFate: {
      ahai: '他们说，深海最黑暗的地方，也有光。',
      xiaolin: '他们说，深海最黑暗的地方，也有光。',
      laozhou: '他们说，深海最黑暗的地方，也有光。',
      suboshi: '他们说，深海最黑暗的地方，也有光。'
    }
  }
];

const mkCrewNode = (
  id: string,
  perspectiveId: CrewMemberId,
  title: string,
  dialogues: DialogueLine[],
  opts: Partial<CrewStoryNode> = {}
): CrewStoryNode => ({
  id,
  perspectiveId,
  title,
  dialogues,
  background: opts.background || 'cockpit',
  ...opts
});

export const crewNodes: CrewStoryNode[] = [
  mkCrewNode('crew_perspective_select', 'ahai', '【船员视角·选择入口】', [
    mkLine('', '深海直播的真相，从不仅仅是观众看到的那样。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.4 }],
      mood: 'calm',
      autoAdvance: true,
      autoAdvanceDelay: 2000
    }),
    mkLine('', '在镜头的盲区，在弹幕的缝隙，在每个人的心里——还有另一个故事在同时发生。', {
      sfx: [{ sfx: 'whisper', delay: 1000, volume: 0.4 }],
      mood: 'mystery',
      autoAdvance: true,
      autoAdvanceDelay: 2500
    }),
    mkLine('', '选择你想要进入的视角：', {
      mood: 'calm'
    })
  ], {
    background: 'intro',
    bgm: 'mystery',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '船员视角入口',
    effects: { crew_perspective_unlocked: true, ahai_fear: 10, xiaolin_fear: 20, laozhou_fear: 5, suboshi_fear: 15 },
    choices: [
      {
        id: 'crew_select_ahai',
        text: '【阿海】主播的视角——镜头背后的焦虑与愧疚',
        nextNodeId: 'crew_ahai_start',
        effect: { crew_selected_perspective: 'ahai' },
        trustEffect: {
          changes: [{ target: 'ahai', value: 10, reason: '选择理解阿海' }],
          hintText: '你选择进入阿海的内心世界'
        }
      },
      {
        id: 'crew_select_xiaolin',
        text: '【小林】摄影师的视角——三年前的阴影与镜头里的真相',
        nextNodeId: 'crew_xiaolin_start',
        effect: { crew_selected_perspective: 'xiaolin' },
        trustEffect: {
          changes: [{ target: 'xiaolin', value: 10, reason: '选择理解小林' }],
          hintText: '你选择进入小林的内心世界'
        }
      },
      {
        id: 'crew_select_laozhou',
        text: '【老周】工程师的视角——冷静表面下的十年秘密',
        nextNodeId: 'crew_laozhou_start',
        effect: { crew_selected_perspective: 'laozhou' },
        trustEffect: {
          changes: [{ target: 'laozhou', value: 10, reason: '选择理解老周' }],
          hintText: '你选择进入老周的内心世界'
        }
      },
      {
        id: 'crew_select_suboshi',
        text: '【苏博士】科学家的视角——知情者的矛盾与选择',
        nextNodeId: 'crew_suboshi_start',
        effect: { crew_selected_perspective: 'suboshi' },
        trustEffect: {
          changes: [{ target: 'suboshi', value: 10, reason: '选择理解苏博士' }],
          hintText: '你选择进入苏博士的内心世界'
        }
      }
    ]
  }),

  mkCrewNode('crew_ahai_start', 'ahai', '【阿海视角·开场】', [
    mkLine('阿海', '哈喽各位观众朋友们大家好！我是你们的深海探险家阿海！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.3 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '手心又出汗了。合同里的那条免责条款，我是不是应该再看一遍？', mood: 'whisper' } as any),
    mkLine('阿海', '今天，我们的"深渊号"载人潜水器即将下潜至马里亚纳海沟10,000米深处！', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'deep', speaker: '【内心】阿海', text: '公司说只要配合直播，出事他们会...他们会怎么样来着？我当时没敢仔细看。', mood: 'scared', triggersSecret: true } as any),
    mkLine('阿海', '这将是人类历史上首次在这个深度进行全程直播！大家弹幕刷起来！', {
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '十字架在胸口发烫。妈，保佑我。', mood: 'whisper' } as any),
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
  ], {
    background: 'cockpit',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '阿海视角开场',
    innerThoughts: [
      mkInnerThought('ahai', '手心又出汗了。合同里的那条免责条款，我是不是应该再看一遍？', 'surface', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('ahai', '公司说只要配合直播，出事他们会...他们会怎么样来着？我当时没敢仔细看。', 'deep', {
        triggersSecret: true,
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }]
      }),
      mkInnerThought('ahai', '十字架在胸口发烫。妈，保佑我。', 'surface', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.4 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_a1', '【阿海·内部】', '合同第17条...我签的时候是不是手抖了？', 500, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 1,
        relativeMs: 800
      }),
      mkCrewDanmaku('cd_a2', '【阿海·内部】', '观众人数三百万了。不能露怯。不能。', 1500, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 3,
        relativeMs: 1200
      }),
      mkCrewDanmaku('cd_a3', '【阿海·内部】', '小林刚才看我的眼神不对。她是不是知道什么？', 2800, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 5,
        relativeMs: 600
      })
    ],
    sensoryEffects: {
      visualWarp: 0.1,
      audioDistortion: 0.1,
      textJitter: 0.05,
      heartbeatIntensity: 0.3,
      breathingIntensity: 0.4
    },
    nextNodeId: 'crew_ahai_descent',
    effects: { ahai_perspective_active: true, ahai_anxiety: 15, ahai_fear: 10 }
  }),

  mkCrewNode('crew_ahai_descent', 'ahai', '【阿海视角·下潜中】', [
    mkLine('老周', '深度800米，水压正常，船体一切正常。', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '老周的声音永远这么稳。真好。', mood: 'calm' } as any),
    mkLine('苏博士', '看到了！一群管水母在左舷！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
      mood: 'urgent'
    }),
    mkLine('阿海', '观众朋友们看到了吗？这些生物在完全黑暗的环境中发着幽蓝的光——', {
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'deep', speaker: '【内心】阿海', text: '这光...合同上有没有说不能播这个颜色的光？我是不是想太多了？', mood: 'anxious' } as any),
    mkLine('小林', '阿海，弹幕有观众问什么时候到海底。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '小林的声音也在抖。原来不只是我一个人害怕。', mood: 'whisper' } as any),
    mkLine('阿海', '以现在的速度，大概还需要两个小时。大家别急，精彩的还在后面！', {
      mood: 'normal'
    }),
    mkLine('老周', '...奇怪。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'suppressed', speaker: '【内心】阿海', text: '老周说"奇怪"的时候，比任何警报都可怕。', mood: 'scared', triggersSecret: true } as any)
  ], {
    background: 'descent',
    bgm: 'tense',
    innerThoughts: [
      mkInnerThought('ahai', '老周的声音永远这么稳。真好。', 'surface'),
      mkInnerThought('ahai', '这光...合同上有没有说不能播这个颜色的光？我是不是想太多了？', 'deep', {
        triggersSecret: true
      }),
      mkInnerThought('ahai', '小林的声音也在抖。原来不只是我一个人害怕。', 'surface'),
      mkInnerThought('ahai', '老周说"奇怪"的时候，比任何警报都可怕。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_a4', '【阿海·内部】', '管水母...公司的LOGO是不是也是水母？', 1500, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 2,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_a5', '【阿海·内部】', '两个小时。我还能装两个小时。', 3000, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 6,
        relativeMs: 800
      }),
      mkCrewDanmaku('cd_a6', '【阿海·内部】', '别慌别慌别慌别慌...', 4500, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 8,
        relativeMs: 1500
      })
    ],
    sensoryEffects: {
      visualWarp: 0.15,
      audioDistortion: 0.15,
      textJitter: 0.1,
      heartbeatIntensity: 0.4,
      breathingIntensity: 0.5
    },
    nextNodeId: 'crew_ahai_first_contact',
    effects: { ahai_anxiety: 25, ahai_fear: 20 }
  }),

  mkCrewNode('crew_ahai_first_contact', 'ahai', '【阿海视角·第一次接触】', [
    mkLine('老周', '声呐...好像探测到什么东西。体积很大，距离我们大约200米。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }, { sfx: 'sonar', delay: 600, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '两百米。在深海里，两百米和零距离有什么区别？', mood: 'scared' } as any),
    mkLine('苏博士', '鲸群？这个深度不应该啊...', {
      mood: 'tense'
    }),
    mkLine('老周', '不，移动方式不对。而且它...正在接近我们。', {
      sfx: [{ sfx: 'metal_creak', delay: 300, volume: 0.4 }, { sfx: 'heartbeat', delay: 800, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'deep', speaker: '【内心】阿海', text: '合同上写的是"不可抗自然因素免责"。这个算不算？这个算吗？', mood: 'terrified', triggersSecret: true } as any),
    mkLine('阿海', '（对镜头）观众朋友们，看来我们有意外访客了！大家期不期待？', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.4 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'suppressed', speaker: '【内心】阿海', text: '我声音抖了吗？刚才那句话抖了吗？三百万观众在听。不能抖。不能抖。', mood: 'terrified' } as any),
    mkLine('小林', '（低声）阿海，你看弹幕...', {
      mood: 'whisper'
    }),
    mkLine('', { perspectiveId: 'ahai', thoughtDepth: 'surface', speaker: '【内心】阿海', text: '十字架。十字架。十字架。', mood: 'whisper' } as any)
  ], {
    background: 'creature',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '阿海视角·第一次接触',
    innerThoughts: [
      mkInnerThought('ahai', '两百米。在深海里，两百米和零距离有什么区别？', 'surface', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }]
      }),
      mkInnerThought('ahai', '合同上写的是"不可抗自然因素免责"。这个算不算？这个算吗？', 'deep', {
        triggersSecret: true,
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.7 }]
      }),
      mkInnerThought('ahai', '我声音抖了吗？刚才那句话抖了吗？三百万观众在听。不能抖。不能抖。', 'suppressed', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('ahai', '十字架。十字架。十字架。', 'surface', {
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_a7', '【阿海·内部】', '它来了它来了它来了它来了', 500, 'ahai', {
        isInnerThought: true,
        color: '#ff0000',
        dialogueIndex: 0,
        relativeMs: 1200
      }),
      mkCrewDanmaku('cd_a8', '【阿海·内部】', '免责条款免责条款免责条款...', 1800, 'ahai', {
        isInnerThought: true,
        color: '#ff0000',
        dialogueIndex: 3,
        relativeMs: 600
      }),
      mkCrewDanmaku('cd_a9', '【阿海·内部】', '我刚才的开场白是不是提前录过？我不记得了。', 3200, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 6,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_a10', '【阿海·内部】', '小林在看我。她是不是发现我在假装镇定？', 4500, 'ahai', {
        isInnerThought: true,
        color: '#ff9999',
        dialogueIndex: 7,
        relativeMs: 1500
      })
    ],
    sensoryEffects: {
      visualWarp: 0.3,
      audioDistortion: 0.25,
      textJitter: 0.2,
      heartbeatIntensity: 0.7,
      breathingIntensity: 0.8
    },
    crewChoices: [
      {
        id: 'ahai_c_keep_calm',
        text: '继续假装镇定，维持直播节奏',
        nextNodeId: 'crew_ahai_keep_live_branch',
        perspectiveId: 'ahai',
        effect: { ahai_resolve: 10, ahai_anxiety: 5 },
        trustEffect: {
          changes: [
            { target: 'ahai', value: 5, reason: '自我克制' },
            { target: 'xiaolin', value: 5, reason: '给队友安全感' }
          ],
          hintText: '你强迫自己保持冷静，给队友做了榜样'
        },
        affectsMentalState: [
          { memberId: 'ahai', resolveDelta: 10, anxietyDelta: -5 }
        ]
      },
      {
        id: 'ahai_c_show_fear',
        text: '无法掩饰，声音开始颤抖',
        nextNodeId: 'crew_ahai_show_fear_branch',
        perspectiveId: 'ahai',
        effect: { ahai_anxiety: 20, ahai_secret_hint: true },
        trustEffect: {
          changes: [
            { target: 'ahai', value: -5, reason: '暴露恐惧' },
            { target: 'xiaolin', value: 10, reason: '真实反而让人安心' }
          ],
          hintText: '你的真实反应让小林觉得你不是在伪装'
        },
        revealsSecretTo: ['xiaolin'],
        affectsMentalState: [
          { memberId: 'ahai', anxietyDelta: 15, fearDelta: 10, sanityDelta: -5 }
        ]
      },
      {
        id: 'ahai_c_confess_contract',
        text: '（低声对小林）那份合同...我签了不该签的东西',
        nextNodeId: 'crew_ahai_confess_branch',
        perspectiveId: 'ahai',
        trustCondition: {
          crewRequirements: [{ memberId: 'xiaolin', minValue: 0 }]
        },
        effect: { ahai_secret_exposed: true, clue_contract_confession: true },
        trustEffect: {
          changes: [
            { target: 'ahai', value: 15, reason: '坦诚' },
            { target: 'xiaolin', value: 20, reason: '分享秘密' }
          ],
          hintText: '你向小林坦白了合同的事'
        },
        revealsSecretTo: ['xiaolin'],
        affectsMentalState: [
          { memberId: 'ahai', resolveDelta: 5, anxietyDelta: -10, secretExposure: 'hinted' },
          { memberId: 'xiaolin', resolveDelta: 5 }
        ],
        crewRelationshipImpact: [
          { from: 'ahai', to: 'xiaolin', trustDelta: 20 }
        ]
      }
    ],
    damageEffects: [
      { system: 'hull', damage: 10, message: '阿海的手开始不受控制地抖动' }
    ]
  }),

  mkCrewNode('crew_xiaolin_start', 'xiaolin', '【小林视角·开场】', [
    mkLine('阿海', '哈喽各位观众朋友们大家好！我是你们的深海探险家阿海！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.3 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '镜头角度0.7度偏左。焦距正常。白平衡...深海里白平衡有什么用。', mood: 'calm' } as any),
    mkLine('阿海', '今天，我们的"深渊号"载人潜水器即将下潜至马里亚纳海沟10,000米深处！', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'deep', speaker: '【内心】小林', text: '三年前。也是这个深度。也是这一艘船。也是...不，那时候它不叫这个名字。', mood: 'scared', triggersSecret: true } as any),
    mkLine('阿海', '这将是人类历史上首次在这个深度进行全程直播！大家弹幕刷起来！', {
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'suppressed', speaker: '【内心】小林', text: '那台相机。我把它砸了。但记忆砸不掉。', mood: 'terrified', triggersSecret: true } as any),
    mkLine('小林', '（小声）阿海，镜头角度调好了，声呐系统正常。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
      mood: 'whisper'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '我的声音。有没有抖？刚才那句话。有没有抖？', mood: 'anxious' } as any),
    mkLine('阿海', '给大家介绍一下，这是我们的摄影师小林，负责记录全程画面。', {
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'deep', speaker: '【内心】小林', text: '苏博士在看我。她一定认出来了。三年前她也在。她为什么不说话？', mood: 'scared' } as any)
  ], {
    background: 'cockpit',
    bgm: 'mystery',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '小林视角开场',
    innerThoughts: [
      mkInnerThought('xiaolin', '镜头角度0.7度偏左。焦距正常。白平衡...深海里白平衡有什么用。', 'surface'),
      mkInnerThought('xiaolin', '三年前。也是这个深度。也是这一艘船。也是...不，那时候它不叫这个名字。', 'deep', {
        triggersSecret: true,
        sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('xiaolin', '那台相机。我把它砸了。但记忆砸不掉。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'glass_crack', delay: 0, volume: 0.4 }]
      }),
      mkInnerThought('xiaolin', '我的声音。有没有抖？刚才那句话。有没有抖？', 'surface', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('xiaolin', '苏博士在看我。她一定认出来了。三年前她也在。她为什么不说话？', 'deep', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_x1', '【小林·内部】', '操作界面和三年前一模一样。连那个按钮的划痕都在。', 300, 'xiaolin', {
        isInnerThought: true,
        color: '#9999ff',
        dialogueIndex: 1,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_x2', '【小林·内部】', '苏博士的眼神。她记得我。她一定记得。', 1500, 'xiaolin', {
        isInnerThought: true,
        color: '#9999ff',
        dialogueIndex: 4,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_x3', '【小林·内部】', '我为什么要来？我明明可以拒绝的。我为什么答应了？', 3000, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 6,
        relativeMs: 800
      }),
      mkCrewDanmaku('cd_x4', '【小林·内部】', '手指按在关闭录音的开关上。就像三年前一样。', 4200, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 8,
        relativeMs: 1200
      })
    ],
    sensoryEffects: {
      visualWarp: 0.2,
      audioDistortion: 0.2,
      textJitter: 0.15,
      heartbeatIntensity: 0.5,
      breathingIntensity: 0.3
    },
    nextNodeId: 'crew_xiaolin_descent',
    effects: { xiaolin_perspective_active: true, xiaolin_fear: 25, xiaolin_secret_hint: true }
  }),

  mkCrewNode('crew_xiaolin_descent', 'xiaolin', '【小林视角·下潜中】', [
    mkLine('老周', '深度800米，水压正常，船体一切正常。', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '一切正常。三年前也是这么说的。', mood: 'whisper' } as any),
    mkLine('苏博士', '看到了！一群管水母在左舷！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'deep', speaker: '【内心】小林', text: '管水母。三年前也看到了。一模一样。时间是个圆圈吗？', mood: 'scared' } as any),
    mkLine('阿海', '观众朋友们看到了吗？这些生物在完全黑暗的环境中发着幽蓝的光——', {
      mood: 'normal'
    }),
    mkLine('小林', '阿海，弹幕有观众问什么时候到海底。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'suppressed', speaker: '【内心】小林', text: '我已经按下了关闭舱内录音的开关。就像三年前一样。没有人会知道我们说了什么。', mood: 'scared', triggersSecret: true } as any),
    mkLine('阿海', '以现在的速度，大概还需要两个小时。大家别急，精彩的还在后面！', {
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '精彩。这个词从他嘴里说出来，特别刺耳。', mood: 'tense' } as any)
  ], {
    background: 'descent',
    bgm: 'mystery',
    innerThoughts: [
      mkInnerThought('xiaolin', '一切正常。三年前也是这么说的。', 'surface'),
      mkInnerThought('xiaolin', '管水母。三年前也看到了。一模一样。时间是个圆圈吗？', 'deep', {
        sfx: [{ sfx: 'static', delay: 0, volume: 0.4 }]
      }),
      mkInnerThought('xiaolin', '我已经按下了关闭舱内录音的开关。就像三年前一样。没有人会知道我们说了什么。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'click', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('xiaolin', '精彩。这个词从他嘴里说出来，特别刺耳。', 'surface')
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_x5', '【小林·内部】', '录音已关闭。标记。', 800, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 0,
        relativeMs: 1500,
        isImportant: true
      }),
      mkCrewDanmaku('cd_x6', '【小林·内部】', '阿海的左手在桌下攥着什么。十字架？', 2200, 'xiaolin', {
        isInnerThought: true,
        color: '#9999ff',
        dialogueIndex: 3,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_x7', '【小林·内部】', '如果我现在告诉他们真相...会怎么样？', 3800, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 5,
        relativeMs: 1200
      })
    ],
    sensoryEffects: {
      visualWarp: 0.25,
      audioDistortion: 0.3,
      textJitter: 0.2,
      heartbeatIntensity: 0.6,
      breathingIntensity: 0.2
    },
    nextNodeId: 'crew_xiaolin_first_contact',
    effects: { xiaolin_fear: 35, xiaolin_secret_exposed_partial: true }
  }),

  mkCrewNode('crew_xiaolin_first_contact', 'xiaolin', '【小林视角·第一次接触】', [
    mkLine('老周', '...奇怪。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '来了。', mood: 'calm' } as any),
    mkLine('阿海', '怎么了老周？', {
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'deep', speaker: '【内心】小林', text: '我等这一刻等了三年。或者说，我害怕这一刻等了三年。', mood: 'tense' } as any),
    mkLine('老周', '声呐...好像探测到什么东西。体积很大，距离我们大约200米。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }, { sfx: 'sonar', delay: 600, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'suppressed', speaker: '【内心】小林', text: '200米。三年前它也是从这个距离开始的。我要砸了这台相机吗？现在？', mood: 'terrified', triggersSecret: true } as any),
    mkLine('苏博士', '鲸群？这个深度不应该啊...', {
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'surface', speaker: '【内心】小林', text: '苏博士在撒谎。她知道那不是鲸群。', mood: 'whisper' } as any),
    mkLine('老周', '不，移动方式不对。而且它...正在接近我们。', {
      sfx: [{ sfx: 'metal_creak', delay: 300, volume: 0.4 }, { sfx: 'heartbeat', delay: 800, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'xiaolin', thoughtDepth: 'deep', speaker: '【内心】小林', text: '相机在我手里发烫。我应该拍下来。还是应该毁掉所有证据？', mood: 'tense' } as any)
  ], {
    background: 'creature',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '小林视角·第一次接触',
    innerThoughts: [
      mkInnerThought('xiaolin', '来了。', 'surface', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('xiaolin', '我等这一刻等了三年。或者说，我害怕这一刻等了三年。', 'deep'),
      mkInnerThought('xiaolin', '200米。三年前它也是从这个距离开始的。我要砸了这台相机吗？现在？', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'glass_crack', delay: 0, volume: 0.3 }]
      }),
      mkInnerThought('xiaolin', '苏博士在撒谎。她知道那不是鲸群。', 'surface'),
      mkInnerThought('xiaolin', '相机在我手里发烫。我应该拍下来。还是应该毁掉所有证据？', 'deep', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_x8', '【小林·内部】', '它来了。三年前的它。', 0, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 0,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_x9', '【小林·内部】', '苏博士的表情。她认得它。她认得。', 1500, 'xiaolin', {
        isInnerThought: true,
        color: '#6666ff',
        dialogueIndex: 4,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_x10', '【小林·内部】', '相机储存卡。里面有三年前的备份。我一直带着。', 3000, 'xiaolin', {
        isInnerThought: true,
        color: '#9999ff',
        dialogueIndex: 6,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_x11', '【小林·内部】', '砸了它。砸了相机。砸了所有的一切。', 4500, 'xiaolin', {
        isInnerThought: true,
        color: '#ff6666',
        dialogueIndex: 8,
        relativeMs: 800
      })
    ],
    sensoryEffects: {
      visualWarp: 0.4,
      audioDistortion: 0.35,
      textJitter: 0.3,
      heartbeatIntensity: 0.8,
      breathingIntensity: 0.1
    },
    crewChoices: [
      {
        id: 'xiaolin_c_record',
        text: '开机，记录下一切',
        nextNodeId: 'crew_xiaolin_record_branch',
        perspectiveId: 'xiaolin',
        effect: { xiaolin_resolve: 15, xiaolin_evidence: true },
        trustEffect: {
          changes: [
            { target: 'xiaolin', value: 10, reason: '选择面对' },
            { target: 'suboshi', value: -10, reason: '可能被记录' }
          ],
          hintText: '你决定让真相被记录下来'
        },
        affectsMentalState: [
          { memberId: 'xiaolin', resolveDelta: 15, fearDelta: 5 }
        ]
      },
      {
        id: 'xiaolin_c_destroy',
        text: '砸毁相机，就像三年前一样',
        nextNodeId: 'crew_xiaolin_destroy_branch',
        perspectiveId: 'xiaolin',
        effect: { xiaolin_broken: true, xiaolin_destroyed_evidence: true },
        trustEffect: {
          changes: [
            { target: 'xiaolin', value: -15, reason: '逃避真相' },
            { target: 'ahai', value: -10, reason: '失去记录' }
          ],
          hintText: '你重复了三年前的选择'
        },
        revealsSecretTo: ['ahai'],
        affectsMentalState: [
          { memberId: 'xiaolin', sanityDelta: -20, hasBrokenDown: true, fearDelta: 20 }
        ]
      },
      {
        id: 'xiaolin_c_tell_ahai',
        text: '（对阿海）三年前...我也在那艘船上',
        nextNodeId: 'crew_xiaolin_tell_branch',
        perspectiveId: 'xiaolin',
        trustCondition: {
          crewRequirements: [{ memberId: 'ahai', minValue: -10 }]
        },
        effect: { xiaolin_secret_exposed: true, xiaolin_confession: true },
        trustEffect: {
          changes: [
            { target: 'xiaolin', value: 15, reason: '终于说出来' },
            { target: 'ahai', value: 15, reason: '分享过去' }
          ],
          hintText: '你向阿海坦白了三年前的事'
        },
        revealsSecretTo: ['ahai', 'suboshi'],
        affectsMentalState: [
          { memberId: 'xiaolin', resolveDelta: 20, anxietyDelta: -15, secretExposure: 'exposed', hasConfessed: true }
        ],
        crewRelationshipImpact: [
          { from: 'xiaolin', to: 'ahai', trustDelta: 20 }
        ]
      }
    ],
    damageEffects: [
      { system: 'camera', damage: 20, message: '小林的手指因用力而发白' }
    ]
  }),

  mkCrewNode('crew_laozhou_start', 'laozhou', '【老周视角·开场】', [
    mkLine('阿海', '哈喽各位观众朋友们大家好！我是你们的深海探险家阿海！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.3 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '第三舱段的螺栓。我昨天检查了七遍。还是想检查第八遍。', mood: 'calm' } as any),
    mkLine('阿海', '今天，我们的"深渊号"载人潜水器即将下潜至马里亚纳海沟10,000米深处！', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'deep', speaker: '【内心】老周', text: '10000米。我造这艘艇的时候，极限是8000。他们让我改。我改了。但我留了一手。', mood: 'calm', triggersSecret: true } as any),
    mkLine('阿海', '这将是人类历史上首次在这个深度进行全程直播！大家弹幕刷起来！', {
      mood: 'urgent'
    }),
    mkLine('小林', '（小声）阿海，镜头角度调好了，声呐系统正常。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
      mood: 'whisper'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '小林的手在抖。和三年前那个小女孩一模一样。我认得她。她不认得我了。', mood: 'whisper' } as any),
    mkLine('阿海', '驾驶舱后面是工程师老周，还有海洋生物学家苏博士。', {
      sfx: [{ sfx: 'sonar', delay: 500, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'suppressed', speaker: '【内心】老周', text: '儿子。爸爸答应过你，这是最后一次。爸爸不会食言。', mood: 'whisper', triggersSecret: true } as any)
  ], {
    background: 'cockpit',
    bgm: 'calm',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '老周视角开场',
    innerThoughts: [
      mkInnerThought('laozhou', '第三舱段的螺栓。我昨天检查了七遍。还是想检查第八遍。', 'surface'),
      mkInnerThought('laozhou', '10000米。我造这艘艇的时候，极限是8000。他们让我改。我改了。但我留了一手。', 'deep', {
        triggersSecret: true
      }),
      mkInnerThought('laozhou', '小林的手在抖。和三年前那个小女孩一模一样。我认得她。她不认得我了。', 'surface'),
      mkInnerThought('laozhou', '儿子。爸爸答应过你，这是最后一次。爸爸不会食言。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.4 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_l1', '【老周·内部】', '紧急上浮舱在第三舱段。只有我知道启动码。', 500, 'laozhou', {
        isInnerThought: true,
        color: '#99ff99',
        dialogueIndex: 1,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_l2', '【老周·内部】', '小林。三年前的那个摄影师。她应该认不出我，那时候我戴着口罩。', 1800, 'laozhou', {
        isInnerThought: true,
        color: '#99ff99',
        dialogueIndex: 4,
        relativeMs: 1200
      }),
      mkCrewDanmaku('cd_l3', '【老周·内部】', '儿子的照片在操作手册夹层里。每次下潜都摸一遍。', 3200, 'laozhou', {
        isInnerThought: true,
        color: '#66ff66',
        dialogueIndex: 6,
        relativeMs: 1500
      })
    ],
    sensoryEffects: {
      visualWarp: 0.05,
      audioDistortion: 0.05,
      textJitter: 0.02,
      heartbeatIntensity: 0.1,
      breathingIntensity: 0.2
    },
    nextNodeId: 'crew_laozhou_descent',
    effects: { laozhou_perspective_active: true, laozhou_resolve: 50, laozhou_secret_hint: true }
  }),

  mkCrewNode('crew_laozhou_descent', 'laozhou', '【老周视角·下潜中】', [
    mkLine('老周', '深度800米，水压正常，船体一切正常。', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '正常。这个深度说"正常"就像在说"还没死"。', mood: 'calm' } as any),
    mkLine('苏博士', '看到了！一群管水母在左舷！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'deep', speaker: '【内心】老周', text: '管水母。苏博士每次下潜都要惊呼一次。三年前也是。那时候她还叫我周工。', mood: 'calm' } as any),
    mkLine('阿海', '观众朋友们看到了吗？这些生物在完全黑暗的环境中发着幽蓝的光——', {
      mood: 'normal'
    }),
    mkLine('小林', '阿海，弹幕有观众问什么时候到海底。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '声呐有杂音。不是普通杂音。是频率干扰。三年前的那个频率。', mood: 'tense', triggersSecret: true } as any),
    mkLine('阿海', '以现在的速度，大概还需要两个小时。大家别急，精彩的还在后面！', {
      mood: 'normal'
    }),
    mkLine('老周', '...奇怪。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'suppressed', speaker: '【内心】老周', text: '来了。它还记得我们的频率。', mood: 'calm' } as any)
  ], {
    background: 'descent',
    bgm: 'calm',
    innerThoughts: [
      mkInnerThought('laozhou', '正常。这个深度说"正常"就像在说"还没死"。', 'surface'),
      mkInnerThought('laozhou', '管水母。苏博士每次下潜都要惊呼一次。三年前也是。那时候她还叫我周工。', 'deep'),
      mkInnerThought('laozhou', '声呐有杂音。不是普通杂音。是频率干扰。三年前的那个频率。', 'surface', {
        triggersSecret: true,
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.3 }]
      }),
      mkInnerThought('laozhou', '来了。它还记得我们的频率。', 'suppressed', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.4 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_l4', '【老周·内部】', '声呐频率异常。标记。', 1200, 'laozhou', {
        isInnerThought: true,
        color: '#99ff99',
        dialogueIndex: 2,
        relativeMs: 1000,
        isImportant: true
      }),
      mkCrewDanmaku('cd_l5', '【老周·内部】', '第三舱段压力值。我在盯着。', 2800, 'laozhou', {
        isInnerThought: true,
        color: '#99ff99',
        dialogueIndex: 4,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_l6', '【老周·内部】', '它回来了。和三年前同一天。同一时间。', 4500, 'laozhou', {
        isInnerThought: true,
        color: '#66ff66',
        dialogueIndex: 7,
        relativeMs: 1200
      })
    ],
    sensoryEffects: {
      visualWarp: 0.1,
      audioDistortion: 0.1,
      textJitter: 0.05,
      heartbeatIntensity: 0.2,
      breathingIntensity: 0.2
    },
    nextNodeId: 'crew_laozhou_first_contact',
    effects: { laozhou_fear: 15, laozhou_detects_frequency: true }
  }),

  mkCrewNode('crew_laozhou_first_contact', 'laozhou', '【老周视角·第一次接触】', [
    mkLine('老周', '声呐...好像探测到什么东西。体积很大，距离我们大约200米。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }, { sfx: 'sonar', delay: 600, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '200米。我告诉儿子如果遇到危险，就数200秒。', mood: 'calm' } as any),
    mkLine('苏博士', '鲸群？这个深度不应该啊...', {
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'deep', speaker: '【内心】老周', text: '苏博士。你比谁都清楚那不是鲸群。三年前是你第一个叫出它的编号。', mood: 'tense' } as any),
    mkLine('老周', '不，移动方式不对。而且它...正在接近我们。', {
      sfx: [{ sfx: 'metal_creak', delay: 300, volume: 0.4 }, { sfx: 'heartbeat', delay: 800, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'suppressed', speaker: '【内心】老周', text: '第三舱段紧急上浮舱。启动码是儿子的生日。我不会忘。', mood: 'calm', triggersSecret: true } as any),
    mkLine('阿海', '（对镜头）观众朋友们，看来我们有意外访客了！大家期不期待？', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.4 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'laozhou', thoughtDepth: 'surface', speaker: '【内心】老周', text: '这个年轻人。他以为这是节目效果。他会懂的。希望他不要懂太晚。', mood: 'calm' } as any)
  ], {
    background: 'creature',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '老周视角·第一次接触',
    innerThoughts: [
      mkInnerThought('laozhou', '200米。我告诉儿子如果遇到危险，就数200秒。', 'surface'),
      mkInnerThought('laozhou', '苏博士。你比谁都清楚那不是鲸群。三年前是你第一个叫出它的编号。', 'deep'),
      mkInnerThought('laozhou', '第三舱段紧急上浮舱。启动码是儿子的生日。我不会忘。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.3 }]
      }),
      mkInnerThought('laozhou', '这个年轻人。他以为这是节目效果。他会懂的。希望他不要懂太晚。', 'surface')
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_l7', '【老周·内部】', '180米。', 500, 'laozhou', {
        isInnerThought: true,
        color: '#ffff66',
        dialogueIndex: 0,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_l8', '【老周·内部】', '手放在紧急上浮舱启动按钮上。', 2000, 'laozhou', {
        isInnerThought: true,
        color: '#99ff99',
        dialogueIndex: 3,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_l9', '【老周·内部】', '150米。儿子。等爸爸回家。', 3500, 'laozhou', {
        isInnerThought: true,
        color: '#66ff66',
        dialogueIndex: 5,
        relativeMs: 1500,
        isImportant: true
      }),
      mkCrewDanmaku('cd_l10', '【老周·内部】', '120米。要不要现在就启动？', 4800, 'laozhou', {
        isInnerThought: true,
        color: '#ffff66',
        dialogueIndex: 7,
        relativeMs: 800
      })
    ],
    sensoryEffects: {
      visualWarp: 0.15,
      audioDistortion: 0.15,
      textJitter: 0.08,
      heartbeatIntensity: 0.3,
      breathingIntensity: 0.3
    },
    crewChoices: [
      {
        id: 'laozhou_c_wait',
        text: '继续观察，收集更多数据',
        nextNodeId: 'crew_laozhou_wait_branch',
        perspectiveId: 'laozhou',
        effect: { laozhou_data: true, laozhou_wait_time: true },
        trustEffect: {
          changes: [
            { target: 'laozhou', value: 5, reason: '专业判断' },
            { target: 'suboshi', value: 10, reason: '配合研究' }
          ],
          hintText: '你选择相信自己的判断，继续观察'
        },
        affectsMentalState: [
          { memberId: 'laozhou', resolveDelta: 5, fearDelta: 5 }
        ]
      },
      {
        id: 'laozhou_c_emergency_tell',
        text: '（低声对所有人）紧急上浮舱在第三舱段',
        nextNodeId: 'crew_laozhou_tell_plan_branch',
        perspectiveId: 'laozhou',
        effect: { laozhou_secret_exposed: true, laozhou_plan_shown: true },
        trustEffect: {
          changes: [
            { target: 'laozhou', value: 15, reason: '坦诚后手' },
            { target: 'ahai', value: 15, reason: '有了希望' },
            { target: 'xiaolin', value: 15, reason: '有了希望' },
            { target: 'suboshi', value: 5, reason: '多了一条退路' }
          ],
          hintText: '你告诉了所有人紧急上浮舱的存在'
        },
        revealsSecretTo: ['ahai', 'xiaolin', 'suboshi'],
        affectsMentalState: [
          { memberId: 'laozhou', resolveDelta: 10, secretExposure: 'exposed' },
          { memberId: 'ahai', fearDelta: -15, resolveDelta: 10 },
          { memberId: 'xiaolin', fearDelta: -10, resolveDelta: 10 },
          { memberId: 'suboshi', fearDelta: -5 }
        ]
      },
      {
        id: 'laozhou_c_use_emitter',
        text: '拉出那台十年前藏的独立发射器',
        nextNodeId: 'crew_laozhou_emitter_branch',
        perspectiveId: 'laozhou',
        memoryCondition: { playthroughAtLeast: 2 },
        effect: { laozhou_secret_emitter: true, laozhou_emitter_used: true },
        trustEffect: {
          changes: [
            { target: 'laozhou', value: 25, reason: '最后的底牌' },
            { target: 'all', value: 15, reason: '看到了生还希望' }
          ],
          hintText: '你拉出了那台连苏博士都不知道的老机器'
        },
        revealsSecretTo: ['suboshi'],
        affectsMentalState: [
          { memberId: 'laozhou', resolveDelta: 20, secretExposure: 'exposed' },
          { memberId: 'suboshi', sanityDelta: 5, resolveDelta: 10 }
        ]
      }
    ],
    damageEffects: [
      { system: 'sonar', damage: 10, message: '老周的手指在操作面板上停留了太久' }
    ]
  }),

  mkCrewNode('crew_suboshi_start', 'suboshi', '【苏博士视角·开场】', [
    mkLine('阿海', '哈喽各位观众朋友们大家好！我是你们的深海探险家阿海！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.3 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '阿海。公司选的这个人。他太年轻了。他不知道自己签的是什么。', mood: 'calm' } as any),
    mkLine('阿海', '今天，我们的"深渊号"载人潜水器即将下潜至马里亚纳海沟10,000米深处！', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'deep', speaker: '【内心】苏博士', text: '10000米。三年前是8000。他们在加码。协议07的验收标准在提高。', mood: 'tense', triggersSecret: true } as any),
    mkLine('阿海', '这将是人类历史上首次在这个深度进行全程直播！大家弹幕刷起来！', {
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'suppressed', speaker: '【内心】苏博士', text: '它在听。直播的信号就是诱饵。我们都是诱饵。', mood: 'scared', triggersSecret: true } as any),
    mkLine('小林', '（小声）阿海，镜头角度调好了，声呐系统正常。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.5 }],
      mood: 'whisper'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '小林。她也在。三年前她活了下来。公司为什么又找她？是故意的吗？', mood: 'tense' } as any),
    mkLine('阿海', '驾驶舱后面是工程师老周，还有海洋生物学家苏博士。', {
      sfx: [{ sfx: 'sonar', delay: 500, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'deep', speaker: '【内心】苏博士', text: '老周。我对不起他。三年前是我让他启动协议07的。那时候我们不知道代价是什么。现在我们知道了。', mood: 'scared' } as any)
  ], {
    background: 'cockpit',
    bgm: 'mystery',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '苏博士视角开场',
    innerThoughts: [
      mkInnerThought('suboshi', '阿海。公司选的这个人。他太年轻了。他不知道自己签的是什么。', 'surface'),
      mkInnerThought('suboshi', '10000米。三年前是8000。他们在加码。协议07的验收标准在提高。', 'deep', {
        triggersSecret: true,
        sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.4 }]
      }),
      mkInnerThought('suboshi', '它在听。直播的信号就是诱饵。我们都是诱饵。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('suboshi', '小林。她也在。三年前她活了下来。公司为什么又找她？是故意的吗？', 'surface'),
      mkInnerThought('suboshi', '老周。我对不起他。三年前是我让他启动协议07的。那时候我们不知道代价是什么。现在我们知道了。', 'deep', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.5 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_s1', '【苏博士·内部】', '协议07参数已校准。和三年前一样的频率。', 400, 'suboshi', {
        isInnerThought: true,
        color: '#ff99ff',
        dialogueIndex: 1,
        relativeMs: 1200,
        isImportant: true
      }),
      mkCrewDanmaku('cd_s2', '【苏博士·内部】', '小林的眼神。她认出我了。三年前我戴着口罩，她怎么认出来的？', 1800, 'suboshi', {
        isInnerThought: true,
        color: '#ff99ff',
        dialogueIndex: 4,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_s3', '【苏博士·内部】', '它在听。它一定在听。三年前的信号它记住了。', 3200, 'suboshi', {
        isInnerThought: true,
        color: '#ff66ff',
        dialogueIndex: 6,
        relativeMs: 1500
      })
    ],
    sensoryEffects: {
      visualWarp: 0.15,
      audioDistortion: 0.2,
      textJitter: 0.1,
      heartbeatIntensity: 0.4,
      breathingIntensity: 0.6
    },
    nextNodeId: 'crew_suboshi_descent',
    effects: { suboshi_perspective_active: true, suboshi_fear: 20, suboshi_secret_hint: true }
  }),

  mkCrewNode('crew_suboshi_descent', 'suboshi', '【苏博士视角·下潜中】', [
    mkLine('老周', '深度800米，水压正常，船体一切正常。', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '正常。老周永远这么说。三年前他也这么说。然后它来了。', mood: 'tense' } as any),
    mkLine('苏博士', '看到了！一群管水母在左舷！', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.6 }],
      mood: 'urgent'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'deep', speaker: '【内心】苏博士', text: '管水母。是信号。它的侦察兵。每次出现之后，它就会来。', mood: 'scared', triggersSecret: true } as any),
    mkLine('阿海', '观众朋友们看到了吗？这些生物在完全黑暗的环境中发着幽蓝的光——', {
      mood: 'normal'
    }),
    mkLine('小林', '阿海，弹幕有观众问什么时候到海底。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.4 }],
      mood: 'normal'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'suppressed', speaker: '【内心】苏博士', text: '我应该现在就告诉他们。告诉他们真相。但公司说如果我说了，我母亲的医药费——', mood: 'terrified', triggersSecret: true } as any),
    mkLine('老周', '...奇怪。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '来了。比三年前早了两分钟。它进化了。或者说，它学到了。', mood: 'scared' } as any)
  ], {
    background: 'descent',
    bgm: 'mystery',
    innerThoughts: [
      mkInnerThought('suboshi', '正常。老周永远这么说。三年前他也这么说。然后它来了。', 'surface'),
      mkInnerThought('suboshi', '管水母。是信号。它的侦察兵。每次出现之后，它就会来。', 'deep', {
        triggersSecret: true
      }),
      mkInnerThought('suboshi', '我应该现在就告诉他们。告诉他们真相。但公司说如果我说了，我母亲的医药费——', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }]
      }),
      mkInnerThought('suboshi', '来了。比三年前早了两分钟。它进化了。或者说，它学到了。', 'surface', {
        sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_s4', '【苏博士·内部】', '管水母出现。预计接触时间：12分47秒。', 1000, 'suboshi', {
        isInnerThought: true,
        color: '#ff99ff',
        dialogueIndex: 1,
        relativeMs: 1500,
        isImportant: true
      }),
      mkCrewDanmaku('cd_s5', '【苏博士·内部】', '母亲的治疗。这个月的账单。公司说只要配合...', 2500, 'suboshi', {
        isInnerThought: true,
        color: '#ff66ff',
        dialogueIndex: 3,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_s6', '【苏博士·内部】', '小林按下了录音开关。和三年前一样。她在保护自己。', 4000, 'suboshi', {
        isInnerThought: true,
        color: '#ff99ff',
        dialogueIndex: 5,
        relativeMs: 1200
      })
    ],
    sensoryEffects: {
      visualWarp: 0.2,
      audioDistortion: 0.25,
      textJitter: 0.15,
      heartbeatIntensity: 0.5,
      breathingIntensity: 0.7
    },
    nextNodeId: 'crew_suboshi_first_contact',
    effects: { suboshi_fear: 35, suboshi_guilt: 25 }
  }),

  mkCrewNode('crew_suboshi_first_contact', 'suboshi', '【苏博士视角·第一次接触】', [
    mkLine('老周', '声呐...好像探测到什么东西。体积很大，距离我们大约200米。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.7 }, { sfx: 'sonar', delay: 600, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '200米。三年前是300米。它更大胆了。', mood: 'scared' } as any),
    mkLine('苏博士', '鲸群？这个深度不应该啊...', {
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'deep', speaker: '【内心】苏博士', text: '我在撒谎。我在对所有人撒谎。就像三年前一样。', mood: 'terrified', triggersSecret: true } as any),
    mkLine('老周', '不，移动方式不对。而且它...正在接近我们。', {
      sfx: [{ sfx: 'metal_creak', delay: 300, volume: 0.4 }, { sfx: 'heartbeat', delay: 800, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'suppressed', speaker: '【内心】苏博士', text: '关掉直播。关掉直播就好。它会以为我们是同类。三年前就是这么活下来的。但公司...公司不会让我关掉。', mood: 'terrified', triggersSecret: true } as any),
    mkLine('阿海', '（对镜头）观众朋友们，看来我们有意外访客了！大家期不期待？', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.4 }],
      mood: 'tense'
    }),
    mkLine('', { perspectiveId: 'suboshi', thoughtDepth: 'surface', speaker: '【内心】苏博士', text: '这个年轻人。他在笑。他不知道那是什么。我应该告诉他。我应该。', mood: 'tense' } as any)
  ], {
    background: 'creature',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '苏博士视角·第一次接触',
    innerThoughts: [
      mkInnerThought('suboshi', '200米。三年前是300米。它更大胆了。', 'surface', {
        sfx: [{ sfx: 'sonar', delay: 0, volume: 0.4 }]
      }),
      mkInnerThought('suboshi', '我在撒谎。我在对所有人撒谎。就像三年前一样。', 'deep', {
        triggersSecret: true,
        sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }]
      }),
      mkInnerThought('suboshi', '关掉直播。关掉直播就好。它会以为我们是同类。三年前就是这么活下来的。但公司...公司不会让我关掉。', 'suppressed', {
        triggersSecret: true,
        sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.4 }]
      }),
      mkInnerThought('suboshi', '这个年轻人。他在笑。他不知道那是什么。我应该告诉他。我应该。', 'surface', {
        sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }]
      })
    ],
    privateDanmakus: [
      mkCrewDanmaku('cd_s7', '【苏博士·内部】', '它在扫描我们。声呐频率匹配协议07。', 500, 'suboshi', {
        isInnerThought: true,
        color: '#ff66ff',
        dialogueIndex: 0,
        relativeMs: 1500,
        isImportant: true
      }),
      mkCrewDanmaku('cd_s8', '【苏博士·内部】', '母亲。对不起。我不能再这样了。', 2000, 'suboshi', {
        isInnerThought: true,
        color: '#ff66ff',
        dialogueIndex: 3,
        relativeMs: 1000
      }),
      mkCrewDanmaku('cd_s9', '【苏博士·内部】', '150米。要不要现在就叫他们关掉直播？', 3500, 'suboshi', {
        isInnerThought: true,
        color: '#ff99ff',
        dialogueIndex: 5,
        relativeMs: 1500
      }),
      mkCrewDanmaku('cd_s10', '【苏博士·内部】', '它的眼睛...是镜头。它在观察我们。也在观察观众。', 5000, 'suboshi', {
        isInnerThought: true,
        color: '#ff00ff',
        dialogueIndex: 7,
        relativeMs: 800,
        isImportant: true
      })
    ],
    sensoryEffects: {
      visualWarp: 0.35,
      audioDistortion: 0.4,
      textJitter: 0.25,
      heartbeatIntensity: 0.75,
      breathingIntensity: 0.9
    },
    crewChoices: [
      {
        id: 'suboshi_c_stop_live',
        text: '（对阿海）关掉直播。现在。',
        nextNodeId: 'crew_suboshi_stop_live_branch',
        perspectiveId: 'suboshi',
        effect: { suboshi_stop_live: true, suboshi_defied_company: true },
        trustEffect: {
          changes: [
            { target: 'suboshi', value: 20, reason: '选择救人' },
            { target: 'ahai', value: -5, reason: '被打断直播' },
            { target: 'laozhou', value: 15, reason: '做出正确选择' }
          ],
          hintText: '你不顾公司威胁，选择了救人'
        },
        revealsSecretTo: ['laozhou'],
        affectsMentalState: [
          { memberId: 'suboshi', resolveDelta: 25, anxietyDelta: -15, secretExposure: 'hinted', hasConfessed: true },
          { memberId: 'laozhou', fearDelta: -10, resolveDelta: 10 }
        ],
        crewRelationshipImpact: [
          { from: 'suboshi', to: 'laozhou', trustDelta: 15 }
        ]
      },
      {
        id: 'suboshi_c_tell_truth',
        text: '（对所有人）三年前的事故不是意外。',
        nextNodeId: 'crew_suboshi_tell_truth_branch',
        perspectiveId: 'suboshi',
        trustCondition: {
          crewRequirements: [{ memberId: 'laozhou', minValue: 10 }]
        },
        effect: { suboshi_truth_told: true, suboshi_secret_exposed: true, clue_previous_incident_crew: true },
        trustEffect: {
          changes: [
            { target: 'suboshi', value: 25, reason: '坦白一切' },
            { target: 'laozhou', value: 20, reason: '共同承担过去' },
            { target: 'ahai', value: 15, reason: '得知真相' },
            { target: 'xiaolin', value: 10, reason: '不再被蒙在鼓里' }
          ],
          hintText: '你终于说出了三年前的真相'
        },
        revealsSecretTo: ['ahai', 'xiaolin', 'laozhou'],
        affectsMentalState: [
          { memberId: 'suboshi', resolveDelta: 30, anxietyDelta: -20, secretExposure: 'exposed', hasConfessed: true },
          { memberId: 'ahai', fearDelta: 5, resolveDelta: 15 },
          { memberId: 'xiaolin', fearDelta: 10, sanityDelta: 5 },
          { memberId: 'laozhou', resolveDelta: 20 }
        ],
        crewRelationshipImpact: [
          { from: 'suboshi', to: 'laozhou', trustDelta: 25 },
          { from: 'suboshi', to: 'ahai', trustDelta: 15 },
          { from: 'suboshi', to: 'xiaolin', trustDelta: 10 }
        ]
      },
      {
        id: 'suboshi_c_stay_silent',
        text: '保持沉默，等待公司的指令',
        nextNodeId: 'crew_suboshi_silent_branch',
        perspectiveId: 'suboshi',
        effect: { suboshi_silent: true, suboshi_guilt: 50 },
        trustEffect: {
          changes: [
            { target: 'suboshi', value: -15, reason: '继续隐瞒' },
            { target: 'laozhou', value: -10, reason: '你应该说出来' }
          ],
          hintText: '你选择了继续保持沉默'
        },
        affectsMentalState: [
          { memberId: 'suboshi', anxietyDelta: 20, sanityDelta: -10, fearDelta: 10 }
        ]
      }
    ],
    damageEffects: [
      { system: 'communication', damage: 15, message: '苏博士的手按在关闭直播的按钮上，指节发白' }
    ]
  }),

  mkCrewNode('crew_converging_crisis', 'ahai', '【汇聚·危机时刻】', [
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
    mkLine('', '四个人的命运，在这一刻交汇。每个人的秘密、恐惧、选择——都将决定最终的结局。', {
      sfx: [{ sfx: 'hull_pressure', delay: 0, volume: 0.5 }],
      mood: 'tense'
    })
  ], {
    background: 'dark',
    bgm: 'tense',
    isRewindCheckpoint: true,
    rewindCheckpointLabel: '汇聚·抉择点',
    crewEndingBranches: [
      {
        nextNodeId: 'crew_ending_all_survive_truth_node',
        priority: 100,
        requiredPerspectiveStates: [
          { memberId: 'suboshi', requiredHasConfessed: true },
          { memberId: 'laozhou', requiredSecretExposure: 'exposed' },
          { memberId: 'ahai', minResolveLevel: 30 }
        ],
        requiredCrewRelationships: [
          { from: 'ahai', to: 'xiaolin', minTrust: 15 },
          { from: 'suboshi', to: 'laozhou', minTrust: 20 }
        ]
      },
      {
        nextNodeId: 'crew_ending_ahai_confession_node',
        priority: 90,
        requiredPerspectiveStates: [
          { memberId: 'ahai', requiredHasConfessed: true },
          { memberId: 'ahai', minResolveLevel: 40 }
        ]
      },
      {
        nextNodeId: 'crew_ending_zhou_secret_saved_node',
        priority: 85,
        requiredPerspectiveStates: [
          { memberId: 'laozhou', requiredSecretExposure: 'exposed' }
        ],
        condition: { laozhou_secret_emitter: true }
      },
      {
        nextNodeId: 'crew_ending_zhou_sacrifice_node',
        priority: 80,
        requiredPerspectiveStates: [
          { memberId: 'laozhou', minResolveLevel: 60 }
        ],
        requiredCrewRelationships: [
          { from: 'laozhou', to: 'ahai', minTrust: 10 },
          { from: 'laozhou', to: 'xiaolin', minTrust: 10 }
        ]
      },
      {
        nextNodeId: 'crew_ending_suboshi_stays_node',
        priority: 75,
        requiredPerspectiveStates: [
          { memberId: 'suboshi', requiredHasConfessed: true },
          { memberId: 'suboshi', minResolveLevel: 50 }
        ],
        condition: { suboshi_tell_truth: true }
      },
      {
        nextNodeId: 'crew_ending_xiaolin_breaks_node',
        priority: 70,
        requiredPerspectiveStates: [
          { memberId: 'xiaolin', requiredHasBrokenDown: true }
        ]
      },
      {
        nextNodeId: 'crew_ending_mutual_betrayal_node',
        priority: 60,
        requiredCrewRelationships: [
          { from: 'ahai', to: 'suboshi', maxTrust: -10 },
          { from: 'xiaolin', to: 'laozhou', maxTrust: -5 }
        ],
        condition: { ahai_secret_exposed: true, xiaolin_secret_exposed: true, suboshi_secret_exposed: true, laozhou_secret_exposed: true }
      },
      {
        nextNodeId: 'crew_ending_all_lost_node',
        priority: 0
      }
    ],
    crewChoices: [
      {
        id: 'crew_c_all_together',
        text: '四个人一起，面对一切',
        nextNodeId: 'crew_ending_all_survive_truth_node',
        perspectiveId: 'ahai',
        trustCondition: {
          crewRequirements: [
            { memberId: 'ahai', minValue: 10 },
            { memberId: 'xiaolin', minValue: 5 },
            { memberId: 'laozhou', minValue: 10 },
            { memberId: 'suboshi', minValue: 5 }
          ],
          overallMinValue: 30
        },
        effect: { crew_united: true },
        trustEffect: {
          changes: [{ target: 'all', value: 20, reason: '团结一致' }],
          hintText: '四人决定共同面对真相'
        },
        affectsMentalState: [
          { memberId: 'ahai', resolveDelta: 20 },
          { memberId: 'xiaolin', fearDelta: -15 },
          { memberId: 'laozhou', resolveDelta: 10 },
          { memberId: 'suboshi', anxietyDelta: -15 }
        ]
      },
      {
        id: 'crew_c_each_for_self',
        text: '各谋生路',
        nextNodeId: 'crew_ending_mutual_betrayal_node',
        perspectiveId: 'ahai',
        condition: { clue_count: 2 },
        trustCondition: {
          overallMaxValue: 0
        },
        effect: { crew_betrayal: true },
        trustEffect: {
          changes: [{ target: 'all', value: -30, reason: '互相背叛' }],
          hintText: '恐惧压倒了信任'
        },
        affectsMentalState: [
          { memberId: 'ahai', sanityDelta: -10 },
          { memberId: 'xiaolin', hasBrokenDown: true, sanityDelta: -20 },
          { memberId: 'suboshi', anxietyDelta: 25 }
        ]
      }
    ],
    sensoryEffects: {
      visualWarp: 0.5,
      audioDistortion: 0.5,
      textJitter: 0.4,
      heartbeatIntensity: 1.0,
      breathingIntensity: 1.0
    },
    perspectiveSwitch: {
      toPerspective: 'ahai',
      transitionType: 'memory_flash'
    }
  }),

  mkCrewNode('crew_ending_all_survive_truth_node', 'suboshi', '【结局·全员生还·真相线】', [
    mkLine('老周', '协议07启动中...频率匹配中...', {
      sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('苏博士', '它停下了。正在后退。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('阿海', '（对镜头）观众朋友们...深海里有东西。有人造了它。我签了不该签的合同...', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('小林', '（把相机对准控制台）都拍下来了。所有的一切。', {
      mood: 'calm'
    }),
    mkLine('', '紧急上浮程序启动。潜水器缓缓上升。在减压舱里，四个人第一次真正地看着彼此。', {
      sfx: [{ sfx: 'bubbles', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', '他们约定，永远不说出海底的真相。但苏博士偷偷将一份数据备份，藏进了小林的相机存储卡里。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.4 }],
      mood: 'mystery'
    })
  ], {
    background: 'escape',
    bgm: 'calm',
    isEnding: true,
    endingId: 'crew_ending_all_survive_truth',
    endingTitle: '全员生还·真相线',
    endingDescription: '四人全部浮出海面。在减压舱里，他们约定永远不说出海底的真相。但苏博士偷偷将一份数据备份，藏进了小林的相机存储卡里。',
    repairEffects: [
      { system: 'hull', amount: 60 },
      { system: 'camera', amount: 60 },
      { system: 'communication', amount: 60 },
      { system: 'sonar', amount: 60 },
      { system: 'control', amount: 60 },
      { system: 'power', amount: 60 }
    ]
  }),

  mkCrewNode('crew_ending_zhou_sacrifice_node', 'laozhou', '【结局·老周的选择·牺牲线】', [
    mkLine('老周', '紧急上浮舱只能坐三个人。阿海，小林，苏博士——你们走。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('阿海', '不可能！我们一起走！', {
      sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.6 }],
      mood: 'scared'
    }),
    mkLine('老周', '（拍拍阿海的肩膀）我儿子今年高考。告诉他，爸爸没食言——这真的是最后一次。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('苏博士', '老周...协议07我来操作——', {
      mood: 'scared'
    }),
    mkLine('老周', '不。这频率只有我能调。十年前我和它"谈"过一次。', {
      sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.4 }],
      mood: 'calm'
    }),
    mkLine('', '紧急上浮舱冲出海面的那一刻，深海里传来一声沉闷的金属共鸣。像是告别，又像是约定。', {
      sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.7 }],
      mood: 'tense'
    })
  ], {
    background: 'dark',
    bgm: 'mystery',
    isEnding: true,
    endingId: 'crew_ending_zhou_sacrifice',
    endingTitle: '老周的选择·牺牲线',
    endingDescription: '老周留在主艇体操作协议07，为其他三人争取上浮时间。紧急上浮舱冲出海面的那一刻，深海里传来一声沉闷的金属共鸣。',
    repairEffects: [
      { system: 'hull', amount: 30 },
      { system: 'camera', amount: 40 },
      { system: 'communication', amount: 30 }
    ]
  }),

  mkCrewNode('crew_ending_suboshi_stays_node', 'suboshi', '【结局·苏博士的抉择·留下线】', [
    mkLine('苏博士', '你们先走。我留下来。', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('老周', '苏博士你——', {
      mood: 'scared'
    }),
    mkLine('苏博士', '它不是在攻击。它在说话。三年前我没听懂。现在...我想我听懂了。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
      mood: 'mystery'
    }),
    mkLine('苏博士', '那个频率...不是驱赶。是求救。它在求救。', {
      sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('小林', '（举起相机）我把你拍下来。全世界都会知道你——', {
      mood: 'scared'
    }),
    mkLine('苏博士', '（微笑）不用。替我照顾好我妈。', {
      sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }],
      mood: 'calm'
    }),
    mkLine('', '当其他人浮出海面时，苏博士终于听懂了那阵嗡鸣。不是攻击。是求救。深海传来了回答——一个更古老、更悲伤的频率。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
      mood: 'mystery'
    })
  ], {
    background: 'creature',
    bgm: 'mystery',
    isEnding: true,
    endingId: 'crew_ending_suboshi_stays',
    endingTitle: '苏博士的抉择·留下线',
    endingDescription: '苏博士选择留下来和"它"对话。当其他人浮出海面时，她终于听懂了那阵嗡鸣——不是攻击，是求救。',
    repairEffects: [
      { system: 'sonar', amount: 50 },
      { system: 'communication', amount: 20 }
    ]
  }),

  mkCrewNode('crew_ending_xiaolin_breaks_node', 'xiaolin', '【结局·小林的崩溃·疯狂线】', [
    mkLine('小林', '（盯着镜头）它在看。它一直在看。三年前就在看。现在也在看。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('阿海', '小林...你怎么了？把相机给我——', {
      mood: 'tense'
    }),
    mkLine('小林', '（砸毁相机）看！看啊！你们看啊！它在镜头里！它一直都在镜头里！！', {
      sfx: [{ sfx: 'glass_crack', delay: 0, volume: 0.8 }, { sfx: 'metal_crash', delay: 500, volume: 0.6 }],
      mood: 'terrified'
    }),
    mkLine('', '她砸毁了所有摄像设备。包括那台藏了三年前备份的。碎片飞溅中，没有人敢上前。', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.5 }],
      mood: 'tense'
    }),
    mkLine('', '当救援人员找到他们时，小林只反复说着一句话："它在镜头里看着我们。"', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
      mood: 'scared'
    })
  ], {
    background: 'damage',
    bgm: 'tense',
    isEnding: true,
    endingId: 'crew_ending_xiaolin_breaks',
    endingTitle: '小林的崩溃·疯狂线',
    endingDescription: '小林再也承受不住三年前和现在的双重记忆，她砸毁了所有摄像设备。当救援人员找到他们时，她只反复说着一句话："它在镜头里看着我们。"',
    repairEffects: [
      { system: 'hull', amount: 40 },
      { system: 'power', amount: 40 },
      { system: 'control', amount: 30 }
    ],
    damageEffects: [
      { system: 'camera', damage: 100, message: '所有摄像设备被彻底损毁' }
    ]
  }),

  mkCrewNode('crew_ending_ahai_confession_node', 'ahai', '【结局·阿海的告白·救赎线】', [
    mkLine('阿海', '（对镜头，声音颤抖）各位观众...我有事要坦白。', {
      sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('阿海', '这次直播不是什么科学考察。是协议07的验收测试。我们都是诱饵。', {
      mood: 'tense'
    }),
    mkLine('苏博士', '阿海！你知道你在说什么吗？！', {
      sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.5 }],
      mood: 'urgent'
    }),
    mkLine('阿海', '（从衣领中扯出十字架）我妈从小教我，真相比什么都重要。背面刻着的——「愿真相比生命更重」。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
      mood: 'calm'
    }),
    mkLine('', '直播信号被切断前的最后一秒，阿海将十字架举到镜头前。金属反射着深海的幽蓝光芒。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.6 }],
      mood: 'tense'
    }),
    mkLine('', '那段只有17秒的告白视频，后来在互联网上被观看了超过10亿次。', {
      sfx: [{ sfx: 'notify', delay: 0, volume: 0.6 }],
      mood: 'calm'
    })
  ], {
    background: 'cockpit',
    bgm: 'tense',
    isEnding: true,
    endingId: 'crew_ending_ahai_confession',
    endingTitle: '阿海的告白·救赎线',
    endingDescription: '阿海在镜头前坦白了一切——合同、协议07、公司的阴谋。直播信号被切断前的最后一秒，他的十字架从衣领中滑落。背面刻着：「愿真相比生命更重」。',
    repairEffects: [
      { system: 'camera', amount: 60 },
      { system: 'communication', amount: 50 },
      { system: 'sonar', amount: 40 }
    ]
  }),

  mkCrewNode('crew_ending_mutual_betrayal_node', 'ahai', '【结局·互相背叛·毁灭线】', [
    mkLine('阿海', '是苏博士！她知道协议07！她三年前就知道！', {
      sfx: [{ sfx: 'door_slam', delay: 0, volume: 0.6 }],
      mood: 'terrified'
    }),
    mkLine('苏博士', '你签的合同！你明知道是陷阱你还是签了！', {
      mood: 'urgent'
    }),
    mkLine('小林', '老周造的艇！他留了紧急上浮舱没告诉我们！他想自己跑！', {
      sfx: [{ sfx: 'glass_crack', delay: 0, volume: 0.5 }],
      mood: 'scared'
    }),
    mkLine('老周', '（一拳砸在控制台）我要是想跑早跑了！', {
      sfx: [{ sfx: 'metal_crash', delay: 0, volume: 0.7 }],
      mood: 'urgent'
    }),
    mkLine('', '恐惧像病毒一样在四人之间蔓延。每一个秘密都变成了匕首。潜水器里的内讧，比外面的怪物更可怕。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.5 }],
      mood: 'tense'
    }),
    mkLine('', '当救援到达时，舱门打开的瞬间，只看到四双互不信任的眼睛。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
      mood: 'scared'
    }),
    mkLine('', '从那以后，他们再也没有见过面。', {
      sfx: [{ sfx: 'water_drip', delay: 0, volume: 0.4 }],
      mood: 'calm'
    })
  ], {
    background: 'damage',
    bgm: 'tense',
    isEnding: true,
    endingId: 'crew_ending_mutual_betrayal',
    endingTitle: '互相背叛·毁灭线',
    endingDescription: '在高压和恐惧之下，四人开始互相指责、揭发彼此的秘密。潜水器里的内讧比外面的怪物更可怕。当救援到达时，舱门打开的瞬间，只看到四双互不信任的眼睛。',
    repairEffects: [
      { system: 'hull', amount: 30 },
      { system: 'power', amount: 30 }
    ],
    damageEffects: [
      { system: 'communication', damage: 60, message: '四人的争吵声盖过了所有系统警报' },
      { system: 'control', damage: 40, message: '控制台被老周一拳砸出裂痕' }
    ]
  }),

  mkCrewNode('crew_ending_zhou_secret_saved_node', 'laozhou', '【结局·老周的后手·完美逃脱线】', [
    mkLine('老周', '都让开。让我来。', {
      sfx: [{ sfx: 'keyboard', delay: 0, volume: 0.6 }],
      mood: 'calm'
    }),
    mkLine('', '老周蹲下身，从第三舱段地板的暗格中拉出一台布满灰尘的机器。外壳上刻着一串编号，比深渊号的出厂日期还要早十年。', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.5 }],
      mood: 'mystery'
    }),
    mkLine('苏博士', '这是...先驱者号上的发射器？它不是被销毁了吗？', {
      mood: 'scared'
    }),
    mkLine('老周', '（按下开关）有些东西，不该被销毁。', {
      sfx: [{ sfx: 'radio_noise', delay: 0, volume: 0.7 }],
      mood: 'calm'
    }),
    mkLine('', '一阵古老、低沉的频率从发射器中传出。那不是协议07。那是更古老的、只有老周知道的一段旋律。', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.6 }],
      mood: 'mystery'
    }),
    mkLine('老周', '十年前，我跟它说过，如果有一天我下来了，就放这个调子。', {
      mood: 'calm'
    }),
    mkLine('', '声呐显示，那个巨大的轮廓停了下来。然后，缓缓地、像鞠躬一样，后退了。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.6 }, { sfx: 'bubbles', delay: 500, volume: 0.4 }],
      mood: 'calm'
    })
  ], {
    background: 'escape',
    bgm: 'calm',
    isEnding: true,
    endingId: 'crew_ending_zhou_secret_saved',
    endingTitle: '老周的后手·完美逃脱线',
    endingDescription: '老周从第三舱段拉出那台他十年前就藏好的独立发射器。当所有人都以为死定了的时候，他用那台老机器发出了一个频率——那是他当年和"它"定下的约定。',
    repairEffects: [
      { system: 'hull', amount: 80 },
      { system: 'camera', amount: 80 },
      { system: 'communication', amount: 80 },
      { system: 'sonar', amount: 80 },
      { system: 'control', amount: 80 },
      { system: 'power', amount: 80 }
    ]
  }),

  mkCrewNode('crew_ending_all_lost_node', 'xiaolin', '【结局·全员失联·深渊线】', [
    mkLine('阿海', '（对着镜头，血迹从额头流下）如果有人在看...记住今天...', {
      sfx: [{ sfx: 'breath', delay: 0, volume: 0.6 }],
      mood: 'scared'
    }),
    mkLine('小林', '相机...还在录吗？', {
      mood: 'scared'
    }),
    mkLine('老周', '深度还在下降...水压已经超过设计极限了...', {
      sfx: [{ sfx: 'metal_creak', delay: 0, volume: 0.7 }, { sfx: 'hull_pressure', delay: 300, volume: 0.8 }],
      mood: 'tense'
    }),
    mkLine('苏博士', '它不是敌人...它在...邀请我们...', {
      sfx: [{ sfx: 'whisper', delay: 0, volume: 0.5 }],
      mood: 'mystery'
    }),
    mkLine('', '画面剧烈震动。然后是一片死寂。', {
      sfx: [{ sfx: 'static', delay: 0, volume: 0.7 }],
      mood: 'tense',
      autoAdvance: true,
      autoAdvanceDelay: 3000
    }),
    mkLine('', '官方记录是"机械故障导致的意外事故"。', {
      mood: 'calm',
      autoAdvance: true,
      autoAdvanceDelay: 2000
    }),
    mkLine('', '但在后来的三年里，全球各地的深海声呐站，都间歇性地接收到了一段规律的信号。', {
      sfx: [{ sfx: 'sonar', delay: 0, volume: 0.5 }],
      mood: 'mystery'
    }),
    mkLine('', '四个心跳的频率，重叠在一起。', {
      sfx: [{ sfx: 'heartbeat', delay: 0, volume: 0.7 }, { sfx: 'heartbeat', delay: 300, volume: 0.6 }, { sfx: 'heartbeat', delay: 600, volume: 0.5 }, { sfx: 'heartbeat', delay: 900, volume: 0.4 }],
      mood: 'scared'
    })
  ], {
    background: 'dark',
    bgm: 'mystery',
    isEnding: true,
    endingId: 'crew_ending_all_lost',
    endingTitle: '全员失联·深渊线',
    endingDescription: '没有人逃出来。官方记录是"机械故障导致的意外事故"。但在后来的三年里，全球各地的深海声呐站，都间歇性地接收到了一段规律的信号——四个心跳的频率，重叠在一起。',
    damageEffects: [
      { system: 'hull', damage: 100, message: '舱体耐压极限已突破' },
      { system: 'power', damage: 100, message: '动力核心停机' },
      { system: 'communication', damage: 100, message: '所有信号中断' }
    ]
  })
];

export const crewStoryData = {
  nodes: crewNodes,
  endings: crewEndings,
  startNodeId: 'crew_perspective_select'
};