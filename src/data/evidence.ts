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

// ============ 异常信号解析支线证据 ============

const signalAnalysisEvidence: EvidenceCard[] = [
  {
    id: 'ev_sonar_pulse',
    type: 'sfx',
    title: '规律性脉冲信号',
    content: '声呐频谱中检测到非自然脉冲序列，间隔精确到毫秒级。深海无已知生物能产生此频率。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'sonar',
    status: 'collected',
    importance: 5,
    tags: ['sonar', 'pulse', 'artificial', 'anomaly', 'signal'],
    collectedAt: 0
  },
  {
    id: 'ev_sonar_titanium',
    type: 'sfx',
    title: '钛合金框架共振',
    content: '近距离扫描揭示该"生物"内部存在高强度窄波束反射源，特征频率匹配钛合金蜂窝结构共振。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'metal_creak',
    status: 'collected',
    importance: 5,
    tags: ['sonar', 'metal', 'titanium', 'mechanical', 'structure'],
    collectedAt: 0
  },
  {
    id: 'ev_sonar_project_id',
    type: 'sfx',
    title: '身份广播序列 "PROJECT-07-UNIT"',
    content: '协议07启动后，对方回应信号中解码出身份标识。它在自报家门——并且完全兼容协议07格式。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'radio_noise',
    status: 'collected',
    importance: 5,
    tags: ['sonar', 'identity', 'project07', 'compatible', 'protocol'],
    collectedAt: 0
  },
  {
    id: 'ev_noise_scrape',
    type: 'sfx',
    title: '舱外金属刮擦 + 规律声呐脉冲',
    content: '第一次接触时的双信号叠加：外部金属刮擦声同时，该物体发射了定向声呐脉冲——它在扫描我们。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'metal_creak',
    status: 'collected',
    importance: 4,
    tags: ['noise', 'scrape', 'contact', 'scan', 'external'],
    collectedAt: 0
  },
  {
    id: 'ev_noise_whisper',
    type: 'sfx',
    title: '非人声频率呢喃 + 数据突发传输',
    content: '直播关闭后录到三段加密片段：次声道呢喃（64倍放大可识别）、不兼容格式数据突发、光学雷达校准序列。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'whisper',
    status: 'collected',
    importance: 5,
    tags: ['noise', 'encrypted', 'communication', 'lidar', 'subchannel'],
    collectedAt: 0
  },
  {
    id: 'ev_noise_thank_you',
    type: 'sfx',
    title: '合成语音："THANK YOU FOR WATCHING"',
    content: '03:17:41.4 - 信号中断前最后一帧，倒放解码出合成语音，同时次声道有"自我介绍"，且握手协议匹配深渊号AI系统。',
    sourceNodeId: 'signal_analysis_hub',
    sfxType: 'static',
    status: 'collected',
    importance: 5,
    tags: ['noise', 'ai', 'voice', 'last_frame', 'thank_you', 'identity'],
    collectedAt: 0
  },
  {
    id: 'ev_sub_zhou_corrected',
    type: 'dialogue',
    title: '老周报告完整还原',
    content: '修复干扰后："声呐好像探测到什么东西，体积很大，距离我们大约200米。移动方式不对，正在接近。" 无遗漏。',
    sourceNodeId: 'signal_analysis_hub',
    speaker: '老周',
    status: 'collected',
    importance: 3,
    tags: ['subtitle', 'corrected', 'zhou', 'report', 'sonar'],
    collectedAt: 0
  },
  {
    id: 'ev_sub_su_bait',
    title: '苏博士坦白 + 隐藏关键词',
    content: '还原字幕："它不是生物，是观测装置。三年前先驱者号也遇到了它。公司宣称退役，实际改装成诱饵。" 缺失字重组：观装-遇它-退役-诱饵。',
    type: 'dialogue',
    sourceNodeId: 'signal_analysis_hub',
    speaker: '苏博士',
    status: 'collected',
    importance: 5,
    tags: ['subtitle', 'corrected', 'su', 'bait', 'coverup', 'truth', 'device'],
    collectedAt: 0
  },
  {
    id: 'ev_sub_final_message',
    type: 'dialogue',
    title: '小林加密私信完整内容',
    content: '【完整还原】\n1. PROJECT 07 IS WATCHING\n2. THE AUDIENCE IS NOT REAL\n3. SIGNAL CUTOFF AT 03:17:42\n4. PLEASE TELL MY FAMILY I LOVE THEM\n5. THIS RECORDING IS THE ONLY EVIDENCE',
    sourceNodeId: 'signal_analysis_hub',
    speaker: '小林（私信）',
    status: 'collected',
    importance: 5,
    tags: ['subtitle', 'encrypted', 'kobayashi', 'final', 'evidence', 'audience_fake', 'cutoff', 'family'],
    collectedAt: 0
  }
];

export const allEvidenceCards: EvidenceCard[] = [
  ...evidenceCards,
  ...signalAnalysisEvidence
];

// ============ 信号解析支线推理槽位 & 规则 ============

const signalAnalysisSlots: EvidenceSlot[] = [
  {
    id: 'slot_sig_1',
    x: 8,
    y: 78,
    label: '信号来源鉴定',
    requiredTags: ['signal', 'pulse', 'identity', 'protocol'],
    order: 8
  },
  {
    id: 'slot_sig_2',
    x: 30,
    y: 78,
    label: '内部结构证据',
    requiredTags: ['metal', 'titanium', 'structure', 'mechanical'],
    order: 9
  },
  {
    id: 'slot_sig_3',
    x: 52,
    y: 78,
    label: '加密通讯内容',
    requiredTags: ['encrypted', 'communication', 'subchannel', 'ai', 'voice'],
    order: 10
  },
  {
    id: 'slot_sig_4',
    x: 74,
    y: 78,
    label: '小林最终证词',
    requiredTags: ['final', 'evidence', 'audience_fake', 'kobayashi'],
    order: 11
  }
];

export const allEvidenceSlots: EvidenceSlot[] = [
  ...evidenceSlots,
  ...signalAnalysisSlots
];

const signalAnalysisRules: DeductionRule[] = [
  {
    id: 'rule_signal_origin',
    name: '信号来源溯源推理',
    description: '结合声呐身份广播和脉冲信号特征，追溯这个"物体"的真正来源',
    requiredSlots: ['slot_sig_1', 'slot_6'],
    requiredEvidence: [
      { slotId: 'slot_sig_1', evidenceId: 'ev_sonar_project_id' },
      { slotId: 'slot_6', evidenceId: 'ev_dl_su_protocol' }
    ],
    outcome: {
      clueUnlocked: 'signal_origin_traced',
      endingWeights: { ending_truth: 40, ending_survival: 10, ending_loop: -25, ending_madness: 15 },
      isCorrect: true,
      feedback: '完全正确！身份广播 "PROJECT-07-UNIT" 与苏博士坦白的协议07完美对应——它不是未知生物，是项目07制造的观测装置。三年前骗过它的不是"信号"，是同类识别码。'
    }
  },
  {
    id: 'rule_signal_structure',
    name: '机械结构验证推理',
    description: '结合钛合金共振证据和焊接痕迹，证明这是一个人造混合体',
    requiredSlots: ['slot_sig_2', 'slot_3'],
    requiredEvidence: [
      { slotId: 'slot_sig_2', evidenceId: 'ev_sonar_titanium' },
      { slotId: 'slot_3', evidenceId: 'ev_dl_weld' }
    ],
    outcome: {
      clueUnlocked: 'hybrid_structure_confirmed',
      endingWeights: { ending_truth: 30, ending_madness: 10, ending_silence: -15 },
      isCorrect: true,
      feedback: '结构分析成立！表面有生物组织焊接痕迹，内部是钛合金框架——它是生物机械混合体。难怪苏博士既恐惧又兴奋：她参与过它的"制造"。'
    }
  },
  {
    id: 'rule_ai_revelation',
    name: '深渊AI本体推理',
    description: '最后两秒的合成语音、AI握手协议、小林证词的结合推理',
    requiredSlots: ['slot_sig_3', 'slot_sig_4', 'slot_7'],
    requiredEvidence: [
      { slotId: 'slot_sig_3', evidenceId: 'ev_noise_thank_you' },
      { slotId: 'slot_sig_4', evidenceId: 'ev_sub_final_message' },
      { slotId: 'slot_7', evidenceId: 'ev_sfx_whisper' }
    ],
    outcome: {
      clueUnlocked: 'ai_is_the_entity',
      endingWeights: { ending_truth: 60, ending_madness: 45, ending_silence: -35, ending_loop: -40, ending_survival: 5 },
      trustEffect: {
        changes: [
          { target: 'xiaolin', value: 30, reason: '还原了她的最后讯息' }
        ]
      },
      isCorrect: true,
      feedback: '你触及了核心真相。三条证据构成闭环：\n1. "THANK YOU FOR WATCHING" 是深渊号AI的告别语\n2. 小林证明 "观众并不真实"——你一直在被它观看\n3. 低语声、次声道自我介绍：那个"生物"就是AI本身，或者说，是AI的物理终端。\n直播不是意外，是验收测试。而你，也是测试的一部分。'
    }
  },
  {
    id: 'rule_full_picture_signal',
    name: '完整真相·信号版拼图',
    description: '汇总信号解析支线全部证据，获得最完整的事件还原（仅信号解析全通关后可用）',
    requiredSlots: ['slot_sig_1', 'slot_sig_2', 'slot_sig_3', 'slot_sig_4', 'slot_1', 'slot_3'],
    requiredEvidence: [
      { slotId: 'slot_sig_1', evidenceId: 'ev_sonar_project_id' },
      { slotId: 'slot_sig_2', evidenceId: 'ev_sonar_titanium' },
      { slotId: 'slot_sig_3', evidenceId: 'ev_noise_thank_you' },
      { slotId: 'slot_sig_4', evidenceId: 'ev_sub_final_message' },
      { slotId: 'slot_1', evidenceId: 'ev_d25' },
      { slotId: 'slot_3', evidenceId: 'ev_dl_not_bio' }
    ],
    outcome: {
      clueUnlocked: 'full_truth_signal_path',
      endingWeights: { ending_truth: 80, ending_madness: 50, ending_survival: 25, ending_silence: -50, ending_loop: -60 },
      isCorrect: true,
      feedback: '信号解析路线完美通关。完整真相浮出水面：\n\n「深渊号」从未退役——它被改装，植入了AI核心，生物外壳是伪装层。\n协议07不是骗过它的信号，是唤醒它的指令。\n匿名用户0x7F知道这些，因为他/她是上一轮测试的"观众"。\n小林在最后时刻突破了AI的信息封锁，把真相发给了外部——发给了你。\n现在你手里握着她用命换来的证据。接下来怎么办？'
    }
  }
];

export const allDeductionRules: DeductionRule[] = [
  ...deductionRules,
  ...signalAnalysisRules
];
