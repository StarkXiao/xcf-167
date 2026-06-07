import type { EvidenceCard, EvidenceSlot, DeductionRule } from '../types/game';

export const evidenceCards: EvidenceCard[] = [
  {
    id: 'ev_d4',
    type: 'danmaku',
    title: '潜水员老张的警告',
    content: '这个深度...祝平安',
    sourceNodeId: 'start',
    username: '潜水员老张',
    color: '#99ff99',
    status: 'collected',
    importance: 3,
    tags: ['warning', 'depth', 'expert'],
    collectedAt: 0
  },
  {
    id: 'ev_d13',
    type: 'danmaku',
    title: '军迷的声呐分析',
    content: '那声呐回波不对！',
    sourceNodeId: 'early_sign',
    username: '军事爱好者',
    color: '#ff6666',
    status: 'collected',
    importance: 4,
    tags: ['sonar', 'anomaly', 'warning'],
    collectedAt: 0
  },
  {
    id: 'ev_d14',
    type: 'danmaku',
    title: '老海员的紧急警告',
    content: '快跑！那个深度没有那么大的生物！',
    sourceNodeId: 'early_sign',
    username: '老海员',
    color: '#ff6666',
    status: 'collected',
    importance: 5,
    tags: ['warning', 'creature', 'impossible', 'urgent'],
    collectedAt: 0
  },
  {
    id: 'ev_d18',
    type: 'danmaku',
    title: '眼尖观众的目击',
    content: '我看到了！右边那个影子！',
    sourceNodeId: 'mid_dive',
    username: '眼尖的人',
    color: '#ffcc00',
    status: 'collected',
    importance: 3,
    tags: ['sighting', 'shadow', 'visual'],
    collectedAt: 0
  },
  {
    id: 'ev_d25',
    type: 'danmaku',
    title: '匿名用户的紧急指令',
    content: '关掉直播。现在。',
    sourceNodeId: 'first_contact',
    username: '匿名用户0x7F',
    color: '#ff0000',
    status: 'collected',
    importance: 5,
    tags: ['warning', 'urgent', 'suspicious', 'insider'],
    collectedAt: 0
  },
  {
    id: 'ev_d28',
    type: 'danmaku',
    title: '内部人士的编号质疑',
    content: '那个编号...深渊号不是三年前就退役了吗？',
    sourceNodeId: 'first_contact',
    username: '内部人士',
    color: '#99ffff',
    status: 'collected',
    importance: 5,
    tags: ['conspiracy', 'vessel_id', 'coverup', 'insider'],
    collectedAt: 0
  },
  {
    id: 'ev_d38',
    type: 'danmaku',
    title: '漏网之鱼的半截弹幕',
    content: '它不是攻击我们，它在【数据损坏】',
    sourceNodeId: 'path_live',
    username: '漏网之鱼',
    color: '#ff0000',
    status: 'collected',
    importance: 5,
    tags: ['behavior', 'censored', 'analysis', 'mystery'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_zhou_sonar',
    type: 'dialogue',
    title: '老周的声呐报告',
    content: '声呐...好像探测到什么东西。体积很大，距离我们大约200米。',
    sourceNodeId: 'early_sign',
    speaker: '老周',
    status: 'collected',
    importance: 4,
    tags: ['sonar', 'creature', 'size', 'report'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_zhou_movement',
    type: 'dialogue',
    title: '老周的移动分析',
    content: '不，移动方式不对。而且它...正在接近我们。',
    sourceNodeId: 'early_sign',
    speaker: '老周',
    status: 'collected',
    importance: 4,
    tags: ['behavior', 'movement', 'approaching', 'unnatural'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_su_excited',
    type: 'dialogue',
    title: '苏博士的异常反应',
    content: '恐惧中带着一丝...兴奋？',
    sourceNodeId: 'analyze_crew',
    speaker: '旁白',
    status: 'collected',
    importance: 4,
    tags: ['crew_reaction', 'suspicious', 'su', 'knowledge'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_zhou_calm',
    type: 'dialogue',
    title: '老周的异常平静',
    content: '最不对劲的是老周。他的表情太平静了。不，不是平静，是麻木。好像他早就知道会发生这一切。',
    sourceNodeId: 'analyze_crew',
    speaker: '旁白',
    status: 'collected',
    importance: 5,
    tags: ['crew_reaction', 'suspicious', 'zhou', 'foreknowledge'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_kobayashi_msg',
    type: 'dialogue',
    title: '小林的神秘讯息',
    content: '小林的手放在键盘上，镜头捕捉到他在快速打字。但直播中并没有他的弹幕。他在跟谁发消息？',
    sourceNodeId: 'analyze_crew',
    speaker: '旁白',
    status: 'collected',
    importance: 4,
    tags: ['crew_reaction', 'suspicious', 'kobayashi', 'communication'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_weld',
    type: 'dialogue',
    title: '生物表面的焊接痕迹',
    content: '——焊接痕迹。那个生物的表面，有明显的工业焊接痕迹。还有一串模糊的编号：P-R-O-J-E-C-T-...',
    sourceNodeId: 'analyze_creature',
    speaker: '旁白',
    status: 'collected',
    importance: 5,
    tags: ['creature', 'artificial', 'weld', 'project', 'evidence'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_not_bio',
    type: 'dialogue',
    title: '非生物结论',
    content: '这东西...不是生物。至少，不全是生物。',
    sourceNodeId: 'analyze_creature',
    speaker: '旁白',
    status: 'collected',
    importance: 5,
    tags: ['creature', 'artificial', 'conclusion', 'hybrid'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_su_protocol',
    type: 'dialogue',
    title: '苏博士的协议07',
    content: '老周，启动协议07。它认得这个信号。三年前就是用这个骗过它的。',
    sourceNodeId: 'path_stop',
    speaker: '苏博士',
    status: 'collected',
    importance: 5,
    tags: ['protocol', 'su', 'zhou', 'previous_encounter', 'coverup'],
    collectedAt: 0
  },
  {
    id: 'ev_dl_zhou_letter',
    type: 'danmaku',
    title: '老周儿子的弹幕',
    content: '爸，你答应过我这次是最后一次。',
    sourceNodeId: 'analyze_danmaku',
    username: '老周的儿子',
    color: '#ffffff',
    status: 'collected',
    importance: 4,
    tags: ['zhou', 'personal', 'previous_mission', 'danger'],
    collectedAt: 0
  },
  {
    id: 'ev_sfx_sonar',
    type: 'sfx',
    title: '异常声呐信号',
    content: '多次探测到规律但非生物特征的声呐回波',
    sfxType: 'sonar',
    status: 'collected',
    importance: 4,
    tags: ['sonar', 'anomaly', 'audio', 'pattern'],
    collectedAt: 0
  },
  {
    id: 'ev_sfx_metal',
    type: 'sfx',
    title: '金属摩擦与碰撞',
    content: '船体外部传来规律性金属摩擦声，非水压导致',
    sfxType: 'metal_creak',
    status: 'collected',
    importance: 4,
    tags: ['audio', 'metal', 'contact', 'external'],
    collectedAt: 0
  },
  {
    id: 'ev_sfx_whisper',
    type: 'sfx',
    title: '舱内低语声',
    content: '录音中拾到非船员的低语，频率不在人声范围',
    sfxType: 'whisper',
    status: 'collected',
    importance: 5,
    tags: ['audio', 'whisper', 'unknown', 'paranormal'],
    collectedAt: 0
  },
  {
    id: 'ev_sfx_radio',
    type: 'sfx',
    title: '协议07频率信号',
    content: '特定无线电频率触发生物后退反应',
    sfxType: 'radio_noise',
    status: 'collected',
    importance: 5,
    tags: ['audio', 'protocol', 'signal', 'response'],
    collectedAt: 0
  }
];

export const evidenceSlots: EvidenceSlot[] = [
  {
    id: 'slot_1',
    x: 8,
    y: 15,
    label: '异常证据 ①',
    requiredTags: ['anomaly', 'warning', 'sighting'],
    order: 1
  },
  {
    id: 'slot_2',
    x: 30,
    y: 15,
    label: '异常证据 ②',
    requiredTags: ['creature', 'behavior', 'sonar'],
    order: 2
  },
  {
    id: 'slot_3',
    x: 52,
    y: 15,
    label: '生物本质',
    requiredTags: ['creature', 'artificial', 'evidence', 'weld'],
    order: 3
  },
  {
    id: 'slot_4',
    x: 74,
    y: 15,
    label: '船员疑点',
    requiredTags: ['crew_reaction', 'suspicious', 'foreknowledge'],
    order: 4
  },
  {
    id: 'slot_5',
    x: 19,
    y: 55,
    label: '内部线索',
    requiredTags: ['insider', 'coverup', 'conspiracy', 'vessel_id'],
    order: 5
  },
  {
    id: 'slot_6',
    x: 41,
    y: 55,
    label: '前科证据',
    requiredTags: ['previous_encounter', 'protocol', 'zhou', 'su'],
    order: 6
  },
  {
    id: 'slot_7',
    x: 63,
    y: 55,
    label: '声纹分析',
    requiredTags: ['audio', 'sonar', 'metal', 'whisper'],
    order: 7
  }
];

export const deductionRules: DeductionRule[] = [
  {
    id: 'rule_creature_identity',
    name: '生物身份推理',
    description: '将异常证据与生物本质联系起来，判断这个"生物"的真实身份',
    requiredSlots: ['slot_1', 'slot_2', 'slot_3'],
    requiredEvidence: [
      { slotId: 'slot_1', evidenceId: 'ev_d14' },
      { slotId: 'slot_2', evidenceId: 'ev_dl_zhou_movement' },
      { slotId: 'slot_3', evidenceId: 'ev_dl_weld' }
    ],
    outcome: {
      clueUnlocked: 'creature_is_artificial',
      endingWeights: { ending_truth: 30, ending_madness: -10 },
      isCorrect: true,
      feedback: '正确！那个深度不可能存在这种体型的生物，加上焊接痕迹和编号...这是人造的。或者说，是被"制造"出来的。'
    }
  },
  {
    id: 'rule_crew_conspiracy',
    name: '船员共谋推理',
    description: '通过船员反应和内部线索，判断谁事先知道真相',
    requiredSlots: ['slot_4', 'slot_5'],
    requiredEvidence: [
      { slotId: 'slot_4', evidenceId: 'ev_dl_zhou_calm' },
      { slotId: 'slot_5', evidenceId: 'ev_d28' }
    ],
    outcome: {
      clueUnlocked: 'crew_knew',
      endingWeights: { ending_truth: 25, ending_survival: 15, ending_loop: -15 },
      isCorrect: true,
      feedback: '正确！老周的平静不是勇敢，是麻木。深渊号三年前就"退役"了，但它还在这里...这不是第一次下潜。'
    }
  },
  {
    id: 'rule_previous_encounter',
    name: '前科事件推理',
    description: '联系协议07和个人线索，还原三年前发生的事',
    requiredSlots: ['slot_6', 'slot_5'],
    requiredEvidence: [
      { slotId: 'slot_6', evidenceId: 'ev_dl_su_protocol' },
      { slotId: 'slot_5', evidenceId: 'ev_dl_zhou_letter' }
    ],
    outcome: {
      clueUnlocked: 'previous_incident',
      endingWeights: { ending_truth: 35, ending_survival: 20, ending_silence: -20 },
      isCorrect: true,
      feedback: '正确！"最后一次"意味着有过很多次。协议07能骗过那个东西，说明他们早就交过手了。三年前的"退役"是谎言。'
    }
  },
  {
    id: 'rule_audio_analysis',
    name: '声纹特征分析',
    description: '通过音频线索分析那个东西的行为模式',
    requiredSlots: ['slot_7', 'slot_2'],
    requiredEvidence: [
      { slotId: 'slot_7', evidenceId: 'ev_sfx_radio' },
      { slotId: 'slot_2', evidenceId: 'ev_sfx_sonar' }
    ],
    outcome: {
      clueUnlocked: 'signal_response',
      endingWeights: { ending_truth: 20, ending_survival: 25, ending_madness: -15 },
      isCorrect: true,
      feedback: '正确！特定频率信号能让它后退，声呐回波呈现规律性——它不是在攻击，是在...扫描？通信？'
    }
  },
  {
    id: 'rule_full_truth',
    name: '真相拼图',
    description: '综合所有关键证据，还原事件全貌',
    requiredSlots: ['slot_1', 'slot_3', 'slot_4', 'slot_6', 'slot_7'],
    requiredEvidence: [
      { slotId: 'slot_1', evidenceId: 'ev_d25' },
      { slotId: 'slot_3', evidenceId: 'ev_dl_not_bio' },
      { slotId: 'slot_4', evidenceId: 'ev_dl_su_excited' },
      { slotId: 'slot_6', evidenceId: 'ev_dl_su_protocol' },
      { slotId: 'slot_7', evidenceId: 'ev_sfx_whisper' }
    ],
    outcome: {
      clueUnlocked: 'full_truth',
      endingWeights: { ending_truth: 50, ending_survival: 10, ending_madness: 30, ending_silence: -30, ending_loop: -20 },
      isCorrect: true,
      feedback: '你接近了全部真相。匿名用户0x7F知道会发生什么，那个"生物"有部分机械结构，苏博士既恐惧又兴奋，协议07是三年前就用过的...这是一场实验。而直播，是实验的一部分。'
    }
  }
];

export const baseEndingWeights: Record<string, number> = {
  ending_truth: 10,
  ending_survival: 20,
  ending_silence: 25,
  ending_madness: 15,
  ending_loop: 20
};
