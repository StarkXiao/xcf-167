import type { CaseFile, TimelineEvent } from '../types/game';

export const caseFiles: CaseFile[] = [
  {
    id: 'case_abyss_2047',
    title: '深渊号直播失联事故',
    designation: 'DEEP-2047-0612',
    status: 'open',
    severity: 'critical',
    date: '2047-06-12',
    location: '马里亚纳海沟',
    depth: '10,000m+',
    summary: '2047年6月12日，深海探险主播「阿海」驾驶深渊号载人潜水器进行马里亚纳海沟万米深度直播。直播进行至03:17:42时信号突然中断，船上4人全部失联。直播录像中记录到不明巨型生物体接近、船体受损、通信异常等关键事件。事后调查发现深渊号编号与三年前已退役的先驱者号存在关联，疑涉协议07条款。',
    timeline: [
      {
        id: 'tl_abyss_01',
        timestamp: '00:00:00',
        label: '直播启动',
        description: '深渊号系统启动，直播回放数据加载。检测到异常中断缓存。',
        nodeId: 'start',
        depth: '0m',
        tags: ['system', 'start'],
        importance: 2
      },
      {
        id: 'tl_abyss_02',
        timestamp: '00:05:00',
        label: '下潜开始',
        description: '深渊号开始下潜，阿海介绍船员：摄影师小林、工程师老周、海洋生物学家苏博士。',
        nodeId: 'intro_1',
        depth: '0m→800m',
        speaker: '阿海',
        tags: ['crew', 'introduction'],
        importance: 2
      },
      {
        id: 'tl_abyss_03',
        timestamp: '00:45:00',
        label: '深度800米·首次异常声呐',
        description: '老周报告声呐探测到体积巨大的不明物体，距离约200米，移动方式异常。苏博士表示此深度不应存在鲸群。',
        nodeId: 'intro_2',
        depth: '800m',
        speaker: '老周',
        tags: ['sonar', 'anomaly', 'creature'],
        importance: 4
      },
      {
        id: 'tl_abyss_04',
        timestamp: '01:15:00',
        label: '深度1500米·不明物体接近',
        description: '声呐目标持续接近至80米。弹幕中出现多条专家警告。阿海面向镜头试图安抚观众。',
        nodeId: 'early_sign',
        depth: '1500m',
        speaker: '老周',
        tags: ['approach', 'warning', 'sonar'],
        importance: 5
      },
      {
        id: 'tl_abyss_05',
        timestamp: '01:50:00',
        label: '深度3200米·画面闪影',
        description: '舷窗画面边缘闪过不明影子，老周报告声呐目标更近至100米→80米。船体出现轻微异响。',
        nodeId: 'mid_dive',
        depth: '3200m',
        tags: ['sighting', 'hull', 'damage'],
        importance: 5
      },
      {
        id: 'tl_abyss_06',
        timestamp: '02:20:00',
        label: '第一次接触',
        description: '灯光照射下发现巨型生物轮廓，疑似双眼结构正对潜水器。弹幕出现管理员删除操作和内部人士发言。',
        nodeId: 'first_contact',
        depth: '3200m+',
        tags: ['contact', 'creature', 'classified'],
        importance: 5
      },
      {
        id: 'tl_abyss_07',
        timestamp: '02:35:00',
        label: '苏博士要求关播',
        description: '苏博士突然要求关掉直播，老周附和。阿海因合同条款犹豫。船员间出现严重分歧。',
        nodeId: 'tension_rises',
        depth: '3200m+',
        speaker: '苏博士',
        tags: ['conflict', 'crew', 'classified'],
        importance: 5
      },
      {
        id: 'tl_abyss_08',
        timestamp: '02:50:00',
        label: '关键抉择',
        description: '阿海必须做出决定：继续直播或关播。此选择将决定所有人的命运走向。',
        nodeId: 'critical_choice',
        depth: '3200m+',
        tags: ['decision', 'critical'],
        importance: 5
      },
      {
        id: 'tl_abyss_09',
        timestamp: '03:00:00',
        label: '船体破损·03号舱泄漏',
        description: '不明物体接触船体，造成严重损坏。03号舱开始泄漏，通信模块遭受电磁干扰。',
        nodeId: 'path_live',
        depth: '3500m+',
        tags: ['damage', 'leak', 'emergency'],
        importance: 5
      },
      {
        id: 'tl_abyss_10',
        timestamp: '03:15:00',
        label: '舷窗目击·机械镜头',
        description: '不明生物贴在舷窗外，其"眼睛"被识别为人造机械镜头，正在观察舱内和直播观众。',
        nodeId: 'live_continue',
        depth: '3500m+',
        tags: ['artificial', 'surveillance', 'revelation'],
        importance: 5
      },
      {
        id: 'tl_abyss_11',
        timestamp: '03:17:42',
        label: '信号中断',
        description: '画面最后一帧显示弹幕来源为「深渊号AI系统」，内容为"谢谢你一直看到最后"。信号时间戳永久停在此处。',
        nodeId: 'ending_path_live',
        depth: '未知',
        tags: ['signal_loss', 'ai', 'final'],
        importance: 5
      }
    ],
    evidenceIds: [
      'ev_d4', 'ev_d13', 'ev_d14', 'ev_d18', 'ev_d25', 'ev_d28', 'ev_d38',
      'ev_dl_zhou_sonar', 'ev_dl_zhou_movement', 'ev_dl_su_excited',
      'ev_dl_zhou_calm', 'ev_dl_kobayashi_msg', 'ev_dl_weld', 'ev_dl_not_bio',
      'ev_dl_su_protocol', 'ev_dl_zhou_letter',
      'ev_sfx_sonar', 'ev_sfx_metal', 'ev_sfx_whisper', 'ev_sfx_radio'
    ],
    audioLogIds: ['ev_sfx_sonar', 'ev_sfx_metal', 'ev_sfx_whisper', 'ev_sfx_radio'],
    relatedCaseIds: ['case_pioneer_2044'],
    personnelInvolved: ['阿海', '小林', '老周', '苏博士'],
    classifiedInfo: '协议07系「死亡直播条款」，深渊号实为三年前已退役的先驱者号重新编号。不明生物疑为协议07的「验收机制」，直播可能为有计划的实验观测行为。'
  },
  {
    id: 'case_pioneer_2044',
    title: '先驱者号失踪事故',
    designation: 'DEEP-2044-0315',
    status: 'classified',
    severity: 'critical',
    date: '2044-03-15',
    location: '马里亚纳海沟',
    depth: '8,500m',
    summary: '三年前，先驱者号在同一海域执行深海勘测任务时失联。官方定性为机械故障导致的沉没事故。但解密档案显示：先驱者号在8,500米深度遭遇与深渊号类似的不明物体；苏博士和老周当时均在船上；事后先驱者号被宣告退役拆解，但实际船体被重新编号为深渊号继续使用。协议07首次在此任务中被激活。',
    timeline: [
      {
        id: 'tl_pioneer_01',
        timestamp: 'T+00:00',
        label: '先驱者号下潜',
        description: '先驱者号开始标准深海勘测任务，目标深度8,500米。',
        depth: '0m',
        tags: ['dive', 'routine'],
        importance: 2
      },
      {
        id: 'tl_pioneer_02',
        timestamp: 'T+02:15',
        label: '首次声呐异常',
        description: '声呐系统探测到异常回波，与深渊号事件中记录的特征一致。',
        depth: '5,200m',
        tags: ['sonar', 'anomaly'],
        importance: 4
      },
      {
        id: 'tl_pioneer_03',
        timestamp: 'T+03:40',
        label: '不明物体接触',
        description: '先驱者号遭遇不明巨型物体近距离接触。船体受损，通信中断。',
        depth: '8,500m',
        tags: ['contact', 'damage', 'emergency'],
        importance: 5
      },
      {
        id: 'tl_pioneer_04',
        timestamp: 'T+04:05',
        label: '协议07激活',
        description: '苏博士与老周启动协议07。特定频率信号使不明物体暂时后退，但未完全脱离。',
        depth: '8,500m',
        tags: ['protocol', 'classified', 'response'],
        importance: 5
      },
      {
        id: 'tl_pioneer_05',
        timestamp: 'T+05:30',
        label: '紧急上浮',
        description: '幸存人员利用紧急上浮舱脱离。2人留守，2人成功上浮获救。',
        depth: '8,500m→0m',
        tags: ['evacuation', 'survivor'],
        importance: 4
      },
      {
        id: 'tl_pioneer_06',
        timestamp: 'T+72:00',
        label: '官方声明',
        description: '官方发布声明称先驱者号因机械故障沉没，所有船员获救。实际上2名留守人员至今下落不明。先驱者号被宣告退役拆解。',
        depth: '-',
        tags: ['coverup', 'official'],
        importance: 5
      }
    ],
    evidenceIds: ['ev_dl_su_protocol', 'ev_sfx_radio'],
    audioLogIds: ['ev_sfx_radio'],
    relatedCaseIds: ['case_abyss_2047'],
    personnelInvolved: ['老周', '苏博士', '未知留守人员'],
    classifiedInfo: '先驱者号事件是协议07的首次实战测试。老周和苏博士是仅有的两名幸存者。船体并未拆解，而是被重新编号为深渊号，用于第二次观测实验。'
  },
  {
    id: 'case_signal_07',
    title: '协议07频率信号记录',
    designation: 'SIG-07-CLASSIFIED',
    status: 'classified',
    severity: 'major',
    date: '2044-03-15 / 2047-06-12',
    location: '马里亚纳海沟',
    depth: '8,500m / 10,000m+',
    summary: '协议07涉及一组特定无线电频率信号，能够引发不明生物体的后退反应。该信号在先驱者号和深渊号两次事件中均被使用。分析显示该频率与不明物体的声呐特征存在匹配模式，暗示二者存在工程关联。该协议的真实目的——「验收机制」——至今未获官方确认。',
    timeline: [
      {
        id: 'tl_sig_01',
        timestamp: '2044-03-15 T+04:05',
        label: '协议07首次激活',
        description: '先驱者号事件中，苏博士与老周首次启动协议07。特定频率信号使不明物体暂时后退。',
        depth: '8,500m',
        tags: ['protocol', 'first_use', 'pioneer'],
        importance: 5
      },
      {
        id: 'tl_sig_02',
        timestamp: '2047-06-12 ~02:50',
        label: '协议07第二次激活',
        description: '深渊号事件中，苏博士指示老周再次启动协议07。她声称"三年前就是用这个骗过它的"。',
        depth: '10,000m+',
        tags: ['protocol', 'second_use', 'abyss'],
        importance: 5
      },
      {
        id: 'tl_sig_03',
        timestamp: '对比分析',
        label: '两次信号对比',
        description: '两次事件中使用的频率信号具有高度一致性，且均引发了不明物体的规律性后退。但第二次的后退持续时间明显缩短，暗示不明物体可能存在适应性。',
        tags: ['analysis', 'comparison', 'adaptation'],
        importance: 4
      }
    ],
    evidenceIds: ['ev_dl_su_protocol', 'ev_sfx_radio', 'ev_sfx_sonar'],
    audioLogIds: ['ev_sfx_radio', 'ev_sfx_sonar'],
    relatedCaseIds: ['case_abyss_2047', 'case_pioneer_2044'],
    personnelInvolved: ['苏博士', '老周'],
    classifiedInfo: '协议07并非防御手段，而是「验收机制」的触发信号。其真实目的可能是通知不明物体（人造观测体）实验进入最终阶段。'
  },
  {
    id: 'case_danmaku_anomaly',
    title: '直播弹幕异常事件',
    designation: 'DAN-2047-ANOMALY',
    status: 'open',
    severity: 'major',
    date: '2047-06-12',
    location: '深渊号直播频道',
    depth: '-',
    summary: '深渊号直播过程中出现多处弹幕异常：管理员白名单ID在普通观众不可见频道发布指令性弹幕；弹幕「匿名用户0x7F」反复出现「关掉直播」警告；直播中断前大量弹幕被管理员删除；最后一帧弹幕发送者ID显示为「深渊号AI系统」，且发送时间早于直播开始时间两小时。所有异常指向直播平台存在未公开的监控与操控机制。',
    timeline: [
      {
        id: 'tl_dan_01',
        timestamp: '02:14:33',
        label: '「深海知情人」发言',
        description: 'ID"深海知情人"发布：「今天的直播，大家别太当真。」',
        nodeId: 'analyze_danmaku',
        tags: ['insider', 'warning'],
        importance: 4
      },
      {
        id: 'tl_dan_02',
        timestamp: '02:38:17',
        label: '协议07关联弹幕',
        description: 'ID"项目编号07"发布：「苏博士，还记得我们的约定吗？」',
        nodeId: 'analyze_danmaku',
        tags: ['protocol', 'insider', 'su'],
        importance: 5
      },
      {
        id: 'tl_dan_03',
        timestamp: '02:55:02',
        label: '老周之子发言',
        description: 'ID"老周的儿子"发布：「爸，你答应过我这次是最后一次。」',
        nodeId: 'analyze_danmaku',
        tags: ['personal', 'zhou', 'previous'],
        importance: 4
      },
      {
        id: 'tl_dan_04',
        timestamp: '03:02:19',
        label: '编号质疑',
        description: 'ID"内部人士07"发布：「深渊号的编号不对。这艘船本应在2044年就被拆解了。」',
        nodeId: 'analyze_danmaku',
        tags: ['conspiracy', 'vessel_id', 'insider'],
        importance: 5
      },
      {
        id: 'tl_dan_05',
        timestamp: '03:09:44',
        label: '0x7F紧急指令',
        description: 'ID"匿名用户0x7F"发布：「关掉直播。现在。」此ID在直播中多次出现同一指令。',
        nodeId: 'first_contact',
        tags: ['urgent', 'insider', 'command'],
        importance: 5
      },
      {
        id: 'tl_dan_06',
        timestamp: '03:15:00+',
        label: '管理员批量删除',
        description: '多条弹幕被管理员标记删除，仅存一条「它不是攻击我们，它在【数据损坏】」。',
        nodeId: 'path_live',
        tags: ['censorship', 'damaged'],
        importance: 5
      },
      {
        id: 'tl_dan_07',
        timestamp: '03:17:42',
        label: 'AI系统弹幕',
        description: '最后一帧弹幕来源为「深渊号AI系统」，内容「谢谢你一直看到最后」。发送时间戳比直播开始早两小时。',
        nodeId: 'ending_path_live',
        tags: ['ai', 'temporal', 'final'],
        importance: 5
      }
    ],
    evidenceIds: ['ev_d25', 'ev_d28', 'ev_d38', 'ev_dl_zhou_letter'],
    audioLogIds: [],
    relatedCaseIds: ['case_abyss_2047', 'case_signal_07'],
    personnelInvolved: ['匿名用户0x7F', '深渊号AI系统', '管理员'],
    classifiedInfo: '弹幕系统存在未公开的管理员白名单通道，用于实时监控和干预直播内容。0x7F可能为项目监督人员或AI代理。时间戳异常暗示直播数据可能被预先写入。'
  }
];

export const allTimelineEvents: TimelineEvent[] = caseFiles.flatMap(c => c.timeline);

export const audioLogEntries: { id: string; title: string; sfxType: string; description: string; relatedCases: string[] }[] = [
  {
    id: 'ev_sfx_sonar',
    title: '异常声呐信号',
    sfxType: 'sonar',
    description: '多次探测到规律但非生物特征的声呐回波。回波频率在先驱者号和深渊号两次事件中高度一致。',
    relatedCases: ['case_abyss_2047', 'case_pioneer_2044']
  },
  {
    id: 'ev_sfx_metal',
    title: '外部金属摩擦',
    sfxType: 'metal_creak',
    description: '船体外部传来规律性金属摩擦声，频率与水压形变不一致，疑为外部物体接触所致。',
    relatedCases: ['case_abyss_2047']
  },
  {
    id: 'ev_sfx_whisper',
    title: '舱内低语',
    sfxType: 'whisper',
    description: '录音中拾到非船员来源的低语，频率不在正常人声范围内。与AI系统弹幕存在时间关联。',
    relatedCases: ['case_abyss_2047']
  },
  {
    id: 'ev_sfx_radio',
    title: '协议07频率信号',
    sfxType: 'radio_noise',
    description: '特定无线电频率信号，在两次事件中均触发不明物体后退反应。信号频率与不明物体的声呐特征匹配。',
    relatedCases: ['case_abyss_2047', 'case_pioneer_2044', 'case_signal_07']
  }
];

export function getCaseById(id: string): CaseFile | undefined {
  return caseFiles.find(c => c.id === id);
}

export function getRelatedCases(caseId: string): CaseFile[] {
  const c = getCaseById(caseId);
  if (!c) return [];
  return c.relatedCaseIds.map(id => getCaseById(id)).filter(Boolean) as CaseFile[];
}
