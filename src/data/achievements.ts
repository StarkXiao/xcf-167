import type { Achievement, ArchiveEntry, SpecialAudio, MenuSkin } from '../types/game';

export const achievements: Achievement[] = [
  {
    id: 'ach_first_playthrough',
    title: '初次下潜',
    description: '完成第一次游戏体验',
    icon: '🌊',
    category: 'story',
    isSecret: false,
    rarity: 'common',
    condition: {
      requiredPlaythroughAtLeast: 1
    },
    reward: {
      archiveId: 'archive_intro'
    }
  },
  {
    id: 'ach_path_live',
    title: '镜头不能停',
    description: '选择坚持直播路线',
    icon: '📹',
    category: 'story',
    isSecret: false,
    rarity: 'common',
    condition: {
      requiredPaths: ['live']
    },
    reward: {
      archiveId: 'archive_path_live'
    }
  },
  {
    id: 'ach_path_stop',
    title: '关了吧，求求了',
    description: '选择关掉直播路线',
    icon: '🔴',
    category: 'story',
    isSecret: false,
    rarity: 'common',
    condition: {
      requiredPaths: ['stop']
    },
    reward: {
      archiveId: 'archive_path_stop'
    }
  },
  {
    id: 'ach_path_ascent',
    title: '紧急上浮',
    description: '选择紧急上浮路线',
    icon: '⬆️',
    category: 'story',
    isSecret: false,
    rarity: 'common',
    condition: {
      requiredPaths: ['ascent']
    },
    reward: {
      archiveId: 'archive_path_ascent'
    }
  },
  {
    id: 'ach_truth',
    title: '深海真相',
    description: '解锁「深海真相」结局',
    icon: '🔍',
    category: 'ending',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredEndings: ['ending_truth']
    },
    reward: {
      archiveId: 'archive_truth',
      audioId: 'audio_truth'
    }
  },
  {
    id: 'ach_survival',
    title: '幸存者',
    description: '解锁「幸存者」结局',
    icon: '🛟',
    category: 'ending',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredEndings: ['ending_survival']
    },
    reward: {
      archiveId: 'archive_survival'
    }
  },
  {
    id: 'ach_silence',
    title: '永远的沉默',
    description: '解锁「永远的沉默」结局',
    icon: '⚰️',
    category: 'ending',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredEndings: ['ending_silence']
    },
    reward: {
      archiveId: 'archive_silence',
      audioId: 'audio_silence'
    }
  },
  {
    id: 'ach_madness',
    title: '深渊回响',
    description: '解锁「深渊回响」结局',
    icon: '🌀',
    category: 'ending',
    isSecret: false,
    rarity: 'epic',
    condition: {
      requiredEndings: ['ending_madness']
    },
    reward: {
      archiveId: 'archive_madness',
      audioId: 'audio_madness'
    }
  },
  {
    id: 'ach_loop',
    title: '无尽回放',
    description: '解锁「无尽回放」结局',
    icon: '♾️',
    category: 'ending',
    isSecret: false,
    rarity: 'epic',
    condition: {
      requiredEndings: ['ending_loop']
    },
    reward: {
      archiveId: 'archive_loop',
      audioId: 'audio_loop'
    }
  },
  {
    id: 'ach_all_endings',
    title: '全结局收集者',
    description: '解锁所有结局',
    icon: '🏆',
    category: 'ending',
    isSecret: false,
    rarity: 'legendary',
    condition: {
      requiredAllEndings: true
    },
    reward: {
      archiveId: 'archive_all_endings',
      skinId: 'skin_gold'
    }
  },
  {
    id: 'ach_detective',
    title: '敏锐的观察者',
    description: '收集至少5条线索',
    icon: '🕵️',
    category: 'clue',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredClueCountAtLeast: 5
    },
    reward: {
      archiveId: 'archive_detective'
    }
  },
  {
    id: 'ach_master_detective',
    title: '真相拼凑者',
    description: '解锁完整真相线索',
    icon: '🧩',
    category: 'clue',
    isSecret: false,
    rarity: 'epic',
    condition: {
      requiredClues: ['full_truth']
    },
    reward: {
      archiveId: 'archive_master_detective',
      audioId: 'audio_full_truth'
    }
  },
  {
    id: 'ach_evidence_collector',
    title: '证据收藏家',
    description: '收集至少8份证据',
    icon: '📋',
    category: 'evidence',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredEvidenceCountAtLeast: 8
    },
    reward: {
      archiveId: 'archive_evidence'
    }
  },
  {
    id: 'ach_perfect_deduction',
    title: '零失误推理',
    description: '推理时从未误判（0次错误）',
    icon: '✨',
    category: 'evidence',
    isSecret: false,
    rarity: 'epic',
    condition: {
      requiredMistakeCountAtMost: 0
    },
    reward: {
      archiveId: 'archive_perfect',
      skinId: 'skin_crystal'
    }
  },
  {
    id: 'ach_guess_master',
    title: '胡乱推理',
    description: '推理错误次数达到5次以上',
    icon: '🤪',
    category: 'evidence',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredMistakeCountAtLeast: 5
    },
    reward: {
      archiveId: 'archive_guess',
      audioId: 'audio_wrong'
    }
  },
  {
    id: 'ach_trust_suboshi',
    title: '苏博士的信任',
    description: '与苏博士达到「信任」关系',
    icon: '🔬',
    category: 'trust',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredTrustLevel: [{ memberId: 'suboshi', minLevel: 'trust' }]
    },
    reward: {
      archiveId: 'archive_suboshi'
    }
  },
  {
    id: 'ach_trust_laozhou',
    title: '老周的托付',
    description: '与老周达到「信任」关系',
    icon: '🔧',
    category: 'trust',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredTrustLevel: [{ memberId: 'laozhou', minLevel: 'trust' }]
    },
    reward: {
      archiveId: 'archive_laozhou'
    }
  },
  {
    id: 'ach_ng_plus',
    title: '周目战士',
    description: '进入第3周目',
    icon: '🔄',
    category: 'special',
    isSecret: false,
    rarity: 'epic',
    condition: {
      requiredPlaythroughAtLeast: 3
    },
    reward: {
      archiveId: 'archive_ng_plus',
      skinId: 'skin_ng'
    }
  },
  {
    id: 'ach_creature_eye',
    title: '对视深渊',
    description: '看到了那只「眼睛」的真相',
    icon: '👁️',
    category: 'secret',
    isSecret: true,
    rarity: 'epic',
    unlockHint: '也许在某个结局中，你能看清它的真面目...',
    condition: {
      requiredClues: ['creature_is_artificial']
    },
    reward: {
      archiveId: 'archive_creature_eye',
      audioId: 'audio_eye'
    }
  },
  {
    id: 'ach_protocol_07',
    title: '协议07的真相',
    description: '发现协议07的完整内容',
    icon: '📄',
    category: 'secret',
    isSecret: true,
    rarity: 'legendary',
    unlockHint: '有人签了不该签的合同...',
    condition: {
      requiredClues: ['clue_protocol07']
    },
    reward: {
      archiveId: 'archive_protocol07'
    }
  },
  {
    id: 'ach_hack_path',
    title: '回溯协议',
    description: '使用了改写直播数据流的选项',
    icon: '💻',
    category: 'secret',
    isSecret: true,
    rarity: 'legendary',
    unlockHint: '需要足够的周目数和全部真相...',
    condition: {
      requiredChoices: ['c_ng_hack_path']
    },
    reward: {
      archiveId: 'archive_hack',
      audioId: 'audio_hack',
      skinId: 'skin_hacker'
    }
  },
  {
    id: 'ach_loop_awareness',
    title: '觉醒者',
    description: '阿海意识到了循环的存在',
    icon: '💫',
    category: 'secret',
    isSecret: true,
    rarity: 'legendary',
    unlockHint: '当信任降至冰点时，有些人会说出真相...',
    condition: {
      requiredClues: ['clue_loop_awareness']
    },
    reward: {
      archiveId: 'archive_awareness',
      audioId: 'audio_loop'
    }
  },
  {
    id: 'ach_pseudo_live_viewer',
    title: '观众与后台观察者',
    description: '首次以伪直播模式通关任意结局',
    icon: '🎬',
    category: 'special',
    isSecret: false,
    rarity: 'rare',
    condition: {
      requiredPlaythroughAtLeast: 2
    },
    reward: {
      archiveId: 'archive_pseudo_live'
    }
  },
  {
    id: 'ach_backstage_hunter',
    title: '后台潜水员',
    description: '查看10条以上后台视角专属弹幕',
    icon: '🔭',
    category: 'secret',
    isSecret: true,
    rarity: 'epic',
    unlockHint: '在二周目开启伪直播模式的后台视角...',
    condition: {
      requiredPlaythroughAtLeast: 3
    },
    reward: {
      archiveId: 'archive_backstage',
      audioId: 'audio_backstage'
    }
  }
];

export const archives: ArchiveEntry[] = [
  {
    id: 'archive_intro',
    title: '【档案·01】关于深海直播事故',
    content: '项目代号：DEEP-2047-0612\n\n时间：2047年6月12日 03:17:42\n地点：马里亚纳海沟挑战者深渊\n\n「深渊号」载人潜水器在下潜至10,000米深度时与水面失去联系。直播信号在同一时刻中断。本次直播峰值观看人数达到2,847,291人，成为人类历史上观看人数最多的深海直播事故。\n\n——数字取证分析局 档案编号：DS-2047-001',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_path_live',
    title: '【档案·02】镜头不能停',
    content: '"如果关掉直播，就什么都没了。"\n\n这是阿海在最后时刻说的话。作为签约主播，他的合同中写明了"必须全程直播"的条款。事后调查发现，该条款被标记为"协议07附加条款"。\n\n——从阿海的个人设备恢复的数据片段',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_path_stop',
    title: '【档案·03】关掉直播',
    content: '"关掉直播。不是为了掩盖什么——是为了让它失去继续观测的理由。"\n\n苏博士的这句话被后台录音完整记录。她似乎知道"那个东西"是什么。\n\n三年前的先驱者号事故后，苏博士曾提交过一份报告，标题为《关于深海人工信号的观测记录》。该报告被列为机密。\n\n——海洋研究院内部文件',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_path_ascent',
    title: '【档案·04】紧急上浮通道',
    content: '"我在造这艘艇的时候...留了一手。"\n\n老周作为深渊号的总工程师，在第三舱段设计了一个独立的紧急上浮舱。这个设计并未出现在官方图纸上。\n\n老周的儿子在三年前的先驱者号事故中失踪。\n\n——造船厂内部机密文件',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_truth',
    title: '【档案·05】深海真相',
    content: '那不是事故。\n\n那是一场实验。\n\n直播本身就是实验的一部分。2,847,291名观众的反应数据被实时采集并分析。深海中的那个"东西"不过是观测终端——而真正的观测对象，是屏幕前的每一个人。\n\n协议07的验收标准：当直播中断时，观众的恐慌指数达到阈值即为实验成功。\n\n本次实验结果：成功。\n\n——CONFIDENTIAL · PROTOCOL-07 · FINAL REPORT',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_survival',
    title: '【档案·06】幸存者记录',
    content: '获救人员：阿海、小林\n\n72小时后，救援队在海平面发现了漂浮的求生舱。舱内两人均处于昏迷状态，但生命体征稳定。\n\n两人醒来后均声称"不记得"深海中发生了什么。医学检查显示他们有明显的记忆缺失症状。\n\n但在小林的相机中，发现了一张被删除的照片——画面中，舷窗外有一只巨大的机械眼。\n\n——救援报告书，部分内容被涂黑',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_silence',
    title: '【档案·07】永远的沉默',
    content: '搜索行动持续了47天。\n\n深渊号的残骸从未被找到。\n\n四名船员：阿海、小林、老周、苏博士——全部列为失踪。\n\n官方公告："机械故障导致的意外事故。"\n\n但有渔民报告，在事故海域附近，连续数个夜晚都能听到深海中传来有规律的嗡鸣声。\n\n——新闻档案，已被撤下',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_madness',
    title: '【档案·08】深渊回响',
    content: '"那些弹幕，真的是观众发的吗？"\n\n对直播弹幕的元数据分析显示，约有3%的弹幕来自不存在的用户ID。这些弹幕的发送时间戳显示，它们是在直播开始之前就已经存在于服务器中的。\n\n更令人不安的是：这些弹幕的内容似乎能"预知"接下来会发生什么。\n\n——独立调查员笔记，来源不明',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_loop',
    title: '【档案·09】无尽回放',
    content: '时间戳：03:17:42\n\n这个数字出现在所有存档中。不管你怎么选择，不管你回溯多少次，直播信号永远在这一刻中断。\n\n你是在看一段录像，还是在创造一段历史？\n\n或者说——这段历史早就已经被写好了，你只是在反复播放而已？\n\n——写在档案封面上的手写字迹',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_all_endings',
    title: '【档案·10】观察者手记',
    content: '你看到了所有的可能性。\n\n每一条分支，每一个选择，每一次命运的分岔——你都走完了。\n\n但你有没有想过，为什么你能做到这些？\n\n为什么你可以一遍又一遍地回放？\n\n答案很简单：因为有人希望你看到。希望你理解。希望你——成为下一个"观察者"。\n\n欢迎加入。\n\n——档案最后一页，没有署名',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_detective',
    title: '【档案·11】观察者笔记',
    content: '"注意那些容易被忽略的细节。"\n\n你比大多数人都更仔细。那些弹幕中的异常、船员表情的微变化、声呐回波中的不规则——你都注意到了。\n\n在深海直播这种极端环境下，每一个细节都可能是生死关键。\n\n——分析员培训手册',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_master_detective',
    title: '【档案·12】真相的碎片',
    content: '线索拼凑完成度：100%\n\n你将所有碎片拼在了一起。焊接痕迹、协议07、先驱者号事故、弹幕中的预知消息——这些并不是孤立的事件，而是同一张网的不同节点。\n\n编织这张网的人，从一开始就知道结局。\n\n而现在，你也知道了。\n\n——系统自动生成的分析报告',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_evidence',
    title: '【档案·13】证据链',
    content: '收集的证据构成了一条完整的逻辑链：\n\n1. 弹幕中的异常ID → 有人预知未来\n2. 船员的异常反应 → 有人隐瞒真相\n3. 生物的焊接痕迹 → "它"是人造的\n4. 协议07的存在 → 这是一场安排好的实验\n\n证据不会说谎。说谎的是人。\n\n——证据分析报告',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_perfect',
    title: '【档案·14】零失误报告',
    content: '推理正确率：100%\n\n在整个分析过程中，你没有做出任何错误判断。证据摆放精确，推理逻辑严密。\n\n这种级别的分析能力，在数字取证局历史上只有三人达到过。\n\n他们中的一人现在是局长。另一人在三年前的先驱者号事故中失踪。\n\n第三人...据说还在某个深海实验室里。\n\n——人力资源部机密评估',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_guess',
    title: '【档案·15】错误记录',
    content: '推理错误次数：5+\n\n说实话，这样的推理能力能通过入职测试也是个奇迹。\n\n不过，也许你的直觉比逻辑更可靠？毕竟，在深渊面前，逻辑本来就没什么用。\n\n——HR的私下吐槽（不小心泄露）',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_suboshi',
    title: '【人物档案·苏博士】',
    content: '姓名：苏晴\n年龄：38岁\n职位：首席海洋生物学家\n\n背景：\n- 海洋生物学博士，专攻深海极端环境生命形态\n- 三年前先驱者号事故的幸存者之一\n- 事故后患上轻度PTSD，拒绝谈论当时发生的事\n- 据说她在事故后主动申请了这次深渊号任务\n\n备注：她知道的比说出来的多得多。\n\n——机密人事档案',
    category: 'character',
    isUnlocked: false
  },
  {
    id: 'archive_laozhou',
    title: '【人物档案·老周】',
    content: '姓名：周建国\n年龄：56岁\n职位：深渊号总工程师\n\n背景：\n- 造船世家出身，有30年深海潜艇设计经验\n- 先驱者号的设计者之一\n- 儿子周晓明在三年前的先驱者号事故中失踪，时年28岁\n- 事故后主动要求参与深渊号的建造，称"要为儿子造一艘不会沉的船"\n\n备注：他在船上留了后手——一个图纸上不存在的紧急上浮舱。\n\n——机密人事档案',
    category: 'character',
    isUnlocked: false
  },
  {
    id: 'archive_ng_plus',
    title: '【档案·16】多周目观测报告',
    content: '第3周目及以上玩家会出现以下异常现象：\n\n1. 对话内容出现微妙变化\n2. 弹幕中会出现"认识你"的ID\n3. 某些选项在新周目中才会解锁\n4. 船员们偶尔会"记住"上周目发生的事\n\n这是系统设计还是真的发生了什么？\n\n——测试员报告，被标记为"BUG"',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_creature_eye',
    title: '【档案·17】那不是眼睛',
    content: '"那不是眼睛。那是一个镜头。一个人造的、冰冷的、巨大的镜头。"\n\n它在观察舱内的人，也在观察屏幕前的你。\n\n那个东西的材质分析结果：它不是生物。但它也不是纯粹的机械。\n\n它是两者的结合——一种"生物机械体"。\n\n项目代号：观察者(Observer)\n制造目的：未知\n制造者：未知\n\n——PROJECT-OBSERVER · 机密文档',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_protocol07',
    title: '【档案·18】协议07全文',
    content: 'PROTOCOL-07 · 深海观测验收协议\n\n甲方：深渊科技集团\n乙方：（被涂黑）\n\n条款摘要：\n1. 乙方需配合完成全程深海直播\n2. 直播中断时即为验收时刻\n3. 验收标准：观众恐慌指数达到阈值（阈值数据加密）\n4. 验收成功后，乙方人员将被"合理处置"\n5. 乙方家属将获得巨额赔偿金，但需签署保密协议\n6. 本协议签署后，乙方不得退出\n\n签署人：阿海（已失踪）\n见证人：（被涂黑）\n\n——深渊科技集团 · 法律部档案',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_hack',
    title: '【档案·19】回溯协议',
    content: '"启动回溯协议 — 改写直播数据流"\n\n这个选项原本不应该出现在这里。\n\n它是系统后门——只有当玩家达到"完全觉醒"状态（3周目以上 + 解锁全部真相）时才会激活。\n\n激活后，直播数据流会被改写。从理论上讲，这应该能改变结局。\n\n但从测试记录来看，无论怎么改写，时间戳永远停在03:17:42。\n\n也许，有些事情是注定的。\n\n——系统开发文档',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_awareness',
    title: '【档案·20】觉醒',
    content: '"你以为你在选择我们的命运？其实是你每次都选了让我们死得更惨的那条路。"\n\n当阿海说出这句话的时候，他已经不是原来的那个他了。\n\n在多次循环后，某些NPC会产生"觉醒"现象——他们开始意识到自己是循环中的角色，意识到有一个"玩家"在操控他们的命运。\n\n目前的处理方案：重置循环，清除记忆。\n\n但每次清除后，觉醒的速度都会更快一点。\n\n——系统异常日志',
    category: 'secret',
    isUnlocked: false
  },
  {
    id: 'archive_pseudo_live',
    title: '【档案·21】伪直播模式',
    content: '【系统功能说明】\n\n伪直播模式（Pseudo-Live Mode）是一种沉浸式体验增强功能。\n\n首周目：\n- 关键弹幕被隐藏，模拟"直播实时性"——你只能看到普通观众的弹幕\n- 隐藏内鬼、知情人的提示，让你体验第一次观看时的迷茫\n\n二周目及以后：\n- 开放"后台视角"——可以看到系统管理员、协议监控等内部弹幕\n- 显示被隐藏的关键弹幕，并标注"[关键]"标签\n- 解锁更微妙的线索和提示\n- 字幕节奏自动调整，让你更快地浏览已知内容\n\n这种设计的目的是：让第一次体验更有悬念，让重复体验更有深度。\n\n——系统设计文档 v2.7',
    category: 'document',
    isUnlocked: false
  },
  {
    id: 'archive_backstage',
    title: '【档案·22】后台弹幕记录',
    content: '【机密】以下为直播期间来自内部ID的弹幕记录：\n\n02:14:33 · 系统后台：[警告] 直播ID与2044年退役编号匹配\n02:14:45 · 管理员日志：白名单用户已接入：深海知情人、项目编号07\n02:38:17 · 协议监控：检测到关键词：协议07。触发级别：黄色\n03:02:19 · AI观测系统：目标已锁定潜水器。状态：观测中。\n03:12:58 · 协议07状态：验收机制启动。当前进度：37%\n03:15:20 · 直播平台后台：检测到异常信号源，尝试切断连接...失败\n\n这些弹幕从未对普通观众显示。它们只存在于服务器日志中。\n\n或者说——只存在于"后台视角"中。\n\n——服务器日志备份，时间戳：03:17:42',
    category: 'secret',
    isUnlocked: false
  }
];

export const specialAudios: SpecialAudio[] = [
  {
    id: 'audio_truth',
    title: '真相的回响',
    description: '深海中传来的低频嗡鸣，夹杂着某种规律的信号',
    customPattern: {
      type: 'sequence',
      freqs: [80, 120, 160, 120, 80],
      duration: 2
    },
    isUnlocked: false
  },
  {
    id: 'audio_silence',
    title: '深海静默',
    description: '当一切归于寂静时，你反而能听到更多',
    customPattern: {
      type: 'noise',
      duration: 3
    },
    isUnlocked: false
  },
  {
    id: 'audio_madness',
    title: '疯狂低语',
    description: '那些弹幕中的声音，似乎在说什么...',
    sfxType: 'whisper',
    isUnlocked: false
  },
  {
    id: 'audio_loop',
    title: '循环之音',
    description: '重复、重复、重复、重复、重复...',
    customPattern: {
      type: 'tone',
      freqs: [440, 440, 330, 440, 440, 330],
      duration: 2
    },
    isUnlocked: false
  },
  {
    id: 'audio_full_truth',
    title: '完整信号',
    description: '当所有线索拼在一起时，信号变得清晰了',
    customPattern: {
      type: 'sequence',
      freqs: [220, 330, 440, 550, 660, 880],
      duration: 3
    },
    isUnlocked: false
  },
  {
    id: 'audio_wrong',
    title: '错误警报',
    description: '你又推错了...',
    sfxType: 'warning',
    isUnlocked: false
  },
  {
    id: 'audio_eye',
    title: '对视',
    description: '当镜头对视镜头时，谁在观察谁？',
    sfxType: 'heartbeat',
    isUnlocked: false
  },
  {
    id: 'audio_hack',
    title: '数据流改写',
    description: '二进制的雨，冲刷着时间的河床',
    sfxType: 'static',
    isUnlocked: false
  },
  {
    id: 'audio_backstage',
    title: '后台信号',
    description: '来自服务器日志深处的低语...',
    sfxType: 'radio_noise',
    isUnlocked: false
  }
];

export const menuSkins: MenuSkin[] = [
  {
    id: 'skin_default',
    name: '深海',
    description: '经典的深海主题界面',
    gradient: 'linear-gradient(180deg, #0a0f1a 0%, #001830 50%, #000a14 100%)',
    accentColor: '#64b4ff',
    titleColor: '#64b4ff',
    subtitleColor: '#4a7a9a',
    buttonBg: 'rgba(20, 40, 70, 0.6)',
    buttonBorder: 'rgba(100, 180, 255, 0.3)',
    bgDecoration: 'radial-gradient(circle at 30% 30%, rgba(100, 180, 255, 0.4), rgba(50, 100, 200, 0.1))',
    particleColor: 'rgba(100, 180, 255, 0.4)',
    isUnlocked: true
  },
  {
    id: 'skin_gold',
    name: '黄金档案',
    description: '全结局收集者的荣耀',
    gradient: 'linear-gradient(180deg, #1a1508 0%, #2d2208 50%, #0f0a02 100%)',
    accentColor: '#ffd700',
    titleColor: '#ffd700',
    subtitleColor: '#b8941e',
    buttonBg: 'rgba(60, 45, 10, 0.7)',
    buttonBorder: 'rgba(255, 215, 0, 0.4)',
    bgDecoration: 'radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.25), rgba(150, 100, 0, 0.05))',
    particleColor: 'rgba(255, 215, 0, 0.4)',
    isUnlocked: false
  },
  {
    id: 'skin_crystal',
    name: '水晶推理',
    description: '零失误推理者的纯净',
    gradient: 'linear-gradient(180deg, #081018 0%, #0e2030 50%, #04080c 100%)',
    accentColor: '#88ffff',
    titleColor: '#88ffff',
    subtitleColor: '#4a8a8a',
    buttonBg: 'rgba(15, 40, 50, 0.6)',
    buttonBorder: 'rgba(136, 255, 255, 0.35)',
    bgDecoration: 'radial-gradient(circle at 30% 30%, rgba(136, 255, 255, 0.25), rgba(50, 120, 140, 0.05))',
    particleColor: 'rgba(136, 255, 255, 0.4)',
    isUnlocked: false
  },
  {
    id: 'skin_ng',
    name: '回溯',
    description: '多周目战士的时空裂痕',
    gradient: 'linear-gradient(180deg, #0f0818 0%, #1a1030 50%, #08040f 100%)',
    accentColor: '#cc88ff',
    titleColor: '#cc88ff',
    subtitleColor: '#7a4a9a',
    buttonBg: 'rgba(40, 20, 60, 0.6)',
    buttonBorder: 'rgba(204, 136, 255, 0.35)',
    bgDecoration: 'radial-gradient(circle at 30% 30%, rgba(204, 136, 255, 0.25), rgba(100, 50, 150, 0.05))',
    particleColor: 'rgba(204, 136, 255, 0.4)',
    isUnlocked: false
  },
  {
    id: 'skin_hacker',
    name: '终端',
    description: '回溯协议激活者的数据流界面',
    gradient: 'linear-gradient(180deg, #041004 0%, #082008 50%, #020802 100%)',
    accentColor: '#44ff44',
    titleColor: '#44ff44',
    subtitleColor: '#2a8a2a',
    buttonBg: 'rgba(10, 40, 10, 0.7)',
    buttonBorder: 'rgba(68, 255, 68, 0.4)',
    bgDecoration: 'radial-gradient(circle at 30% 30%, rgba(68, 255, 68, 0.2), rgba(30, 100, 30, 0.05))',
    particleColor: 'rgba(68, 255, 68, 0.35)',
    isUnlocked: false
  }
];
