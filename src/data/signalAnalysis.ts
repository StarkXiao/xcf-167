import type {
  SonarChallenge,
  NoiseChallenge,
  SubtitleChallenge,
  SonarPattern,
  NoiseSegment,
  SubtitleError
} from '../types/game';

const generateSonarData = (
  baseFreq: number,
  patternType: 'regular' | 'pulse' | 'sweep' | 'irregular' | 'encrypted',
  intensity: number = 0.5,
  count: number = 40
) => {
  const points: { frequency: number; intensity: number; time: number }[] = [];
  for (let i = 0; i < count; i++) {
    const time = i * 0.1;
    let freq = baseFreq;
    let inten = intensity;

    switch (patternType) {
      case 'regular':
        inten = intensity * (0.8 + Math.sin(i * 0.5) * 0.2);
        break;
      case 'pulse':
        inten = intensity * (i % 5 < 2 ? 1 : 0.15);
        freq = baseFreq + (i % 5 < 2 ? 0 : -15);
        break;
      case 'sweep':
        freq = baseFreq + Math.sin(i * 0.3) * 35;
        inten = intensity * (0.6 + Math.cos(i * 0.4) * 0.4);
        break;
      case 'irregular':
        freq = baseFreq + (Math.random() - 0.5) * 60;
        inten = intensity * (0.3 + Math.random() * 0.7);
        break;
      case 'encrypted':
        inten = intensity * (0.4 + ((i * 7) % 11) / 20);
        freq = baseFreq + ((i * 13) % 8) * 6 - 24;
        break;
    }

    points.push({
      frequency: Math.max(20, Math.min(200, freq)),
      intensity: Math.max(0.05, Math.min(1, inten)),
      time
    });
  }
  return points;
};

const generateWaveform = (
  pattern: 'sine' | 'square' | 'noise' | 'voice' | 'mechanical' | 'creature',
  length: number = 60
) => {
  const wave: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    let v = 0;
    switch (pattern) {
      case 'sine':
        v = Math.sin(t * Math.PI * 8) * 0.6;
        break;
      case 'square':
        v = Math.sin(t * Math.PI * 12) > 0 ? 0.7 : -0.7;
        break;
      case 'noise':
        v = (Math.random() - 0.5) * 0.9;
        break;
      case 'voice':
        v = Math.sin(t * Math.PI * 4) * 0.4 + Math.sin(t * Math.PI * 15) * 0.25 + (Math.random() - 0.5) * 0.15;
        break;
      case 'mechanical':
        v = (Math.sin(t * Math.PI * 20) > 0 ? 0.5 : -0.5) * (0.3 + Math.sin(t * Math.PI * 3) * 0.4);
        break;
      case 'creature':
        v = Math.sin(t * Math.PI * 2) * 0.5 + Math.sin(t * Math.PI * 25) * 0.3 * Math.sin(t * Math.PI * 6);
        break;
    }
    wave.push(v);
  }
  return wave;
};

export const sonarChallenges: SonarChallenge[] = [
  {
    id: 'sonar_1',
    title: '初遇：异常回波',
    description: '深度1500米处的声呐记录。找出所有非生物特征的回波模式。注意那些呈现规律性脉冲的信号——它们不太可能来自自然生物。',
    difficulty: 'easy',
    patterns: [
      {
        id: 'sp_normal_fish',
        name: '鱼群回波',
        description: '典型深海鱼群的分散回波，无规律可循',
        dataPoints: generateSonarData(85, 'irregular', 0.4),
        isAnomaly: false,
        anomalyType: 'biological'
      },
      {
        id: 'sp_whale',
        name: '鲸类呼叫',
        description: '低频蓝鲸通讯信号，特征是缓慢的频率扫描',
        dataPoints: generateSonarData(45, 'sweep', 0.7),
        isAnomaly: false,
        anomalyType: 'biological'
      },
      {
        id: 'sp_mystery_pulse',
        name: '未知脉冲信号',
        description: '规律的周期性脉冲，间隔精确一致。深海中没有已知生物能产生这种信号。',
        dataPoints: generateSonarData(120, 'pulse', 0.85),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['脉冲', '规律', '人造']
      },
      {
        id: 'sp_plankton',
        name: '浮游生物层',
        description: '深海散射层的常见回波，大范围低强度',
        dataPoints: generateSonarData(60, 'regular', 0.25),
        isAnomaly: false,
        anomalyType: 'biological'
      },
      {
        id: 'sp_encoded_sweep',
        name: '加密扫描信号',
        description: '快速的频率跳变模式，类似编码通讯。附带极弱的次声波载波。',
        dataPoints: generateSonarData(150, 'encrypted', 0.7),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['加密', '扫描', '编码']
      }
    ],
    targetPatternIds: ['sp_mystery_pulse', 'sp_encoded_sweep'],
    rewardClueId: 'clue_sonar_artificial_signal',
    rewardEvidenceId: 'ev_sonar_pulse',
    endingWeightModifiers: { ending_truth: 15, ending_survival: 10, ending_madness: -5 }
  },
  {
    id: 'sonar_2',
    title: '对峙：近距离扫描',
    description: '深度3200米，距离50米处的精确扫描记录。那个"生物"正在被扫描——或者说，它在扫描我们。找出能证明它含有人造成分的信号模式。',
    difficulty: 'medium',
    patterns: [
      {
        id: 'sp2_skin_echo',
        name: '表层组织回波',
        description: '类似生物软组织的回声衰减特征',
        dataPoints: generateSonarData(70, 'irregular', 0.5),
        isAnomaly: false,
        anomalyType: 'biological'
      },
      {
        id: 'sp2_skeleton_reflection',
        name: '金属框架反射',
        description: '高强度、窄波束的反射信号，特征频率对应钛合金结构共振',
        dataPoints: generateSonarData(130, 'pulse', 0.92),
        isAnomaly: true,
        anomalyType: 'mechanical',
        matchKeywords: ['金属', '钛合金', '框架']
      },
      {
        id: 'sp2_propulsion',
        name: '推进系统噪音',
        description: '稳定的高频机械振动，来自某种内置推进装置',
        dataPoints: generateSonarData(175, 'regular', 0.65),
        isAnomaly: true,
        anomalyType: 'mechanical',
        matchKeywords: ['推进', '机械', '高频']
      },
      {
        id: 'sp2_biolum',
        name: '生物发光干扰',
        description: '伴随生物发光的微弱电磁干扰，深海生物常见',
        dataPoints: generateSonarData(50, 'sweep', 0.3),
        isAnomaly: false,
        anomalyType: 'biological'
      },
      {
        id: 'sp2_scan_beam',
        name: '主动扫描波束',
        description: '定向发射的Lidar-like扫描信号，频率在180-200Hz区间快速跳变',
        dataPoints: generateSonarData(190, 'encrypted', 0.78),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['扫描', '激光', '定向']
      },
      {
        id: 'sp2_water_flow',
        name: '水流扰动',
        description: '物体移动造成的水流紊动回声，属于自然物理现象',
        dataPoints: generateSonarData(40, 'irregular', 0.35),
        isAnomaly: false,
        anomalyType: 'biological'
      }
    ],
    targetPatternIds: ['sp2_skeleton_reflection', 'sp2_propulsion', 'sp2_scan_beam'],
    rewardClueId: 'clue_sonar_mechanical_structure',
    rewardEvidenceId: 'ev_sonar_titanium',
    endingWeightModifiers: { ending_truth: 25, ending_survival: 15, ending_silence: -10, ending_madness: 5 }
  },
  {
    id: 'sonar_3',
    title: '协议：频率回应',
    description: '协议07启动前后的完整频率对比。找出它"回应"时的特定信号特征——这能告诉我们它到底是什么。',
    difficulty: 'hard',
    patterns: [
      {
        id: 'sp3_protocol_transmit',
        name: '协议07广播信号',
        description: '人类发射的协议07频率，标准47.5kHz调制波形',
        dataPoints: generateSonarData(95, 'regular', 0.88),
        isAnomaly: false,
        matchKeywords: ['协议', '广播', '人类']
      },
      {
        id: 'sp3_response_ack',
        name: '应答确认脉冲',
        description: '信号接收到协议后的立即回应，格式与协议07完全兼容——这说明它"认识"这个协议',
        dataPoints: generateSonarData(95, 'pulse', 0.9),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['应答', '兼容', '认识']
      },
      {
        id: 'sp3_data_transfer',
        name: '数据包传输',
        description: '高频段出现的大量结构化数据交换，类似设备握手后的信息同步',
        dataPoints: generateSonarData(160, 'encrypted', 0.82),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['数据', '传输', '同步']
      },
      {
        id: 'sp3_identity_broadcast',
        name: '身份标识广播',
        description: '重复发送的固定序列，解码后显示为 "PROJECT-07-UNIT"。它在自报家门。',
        dataPoints: generateSonarData(110, 'pulse', 0.76),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['身份', 'PROJECT', '编号']
      },
      {
        id: 'sp3_bio_cover',
        name: '伪装生物信号',
        description: '同步发射的低强度鲸类模拟信号，明显是为了掩蔽真实通讯内容',
        dataPoints: generateSonarData(55, 'sweep', 0.45),
        isAnomaly: true,
        anomalyType: 'artificial',
        matchKeywords: ['伪装', '模拟', '掩蔽']
      },
      {
        id: 'sp3_background',
        name: '深海背景噪音',
        description: '正常的深海环境背景声，无异常',
        dataPoints: generateSonarData(30, 'irregular', 0.2),
        isAnomaly: false,
        anomalyType: 'biological'
      }
    ],
    targetPatternIds: ['sp3_response_ack', 'sp3_data_transfer', 'sp3_identity_broadcast', 'sp3_bio_cover'],
    rewardClueId: 'clue_sonar_protocol_compatible',
    rewardEvidenceId: 'ev_sonar_project_id',
    endingWeightModifiers: { ending_truth: 40, ending_survival: 20, ending_madness: 20, ending_silence: -25, ending_loop: -15 }
  }
];

export const noiseChallenges: NoiseChallenge[] = [
  {
    id: 'noise_1',
    title: '舱外杂音：第一次接触',
    description: '深度1500米时的全向麦克风录音。隔离并识别所有非自然来源的声音片段。',
    difficulty: 'easy',
    targetCategory: 'mechanical',
    segments: [
      {
        id: 'ns1_bubbles',
        startTime: 0,
        endTime: 2.5,
        waveform: generateWaveform('noise', 50),
        label: '气泡上升声',
        isTarget: false,
        category: 'interference'
      },
      {
        id: 'ns1_creak',
        startTime: 2.5,
        endTime: 5,
        waveform: generateWaveform('mechanical', 60),
        label: '船体受压呻吟',
        isTarget: false,
        category: 'human'
      },
      {
        id: 'ns1_whale',
        startTime: 5,
        endTime: 9,
        waveform: generateWaveform('sine', 80),
        label: '远处鲸歌',
        isTarget: false,
        category: 'creature'
      },
      {
        id: 'ns1_scrape',
        startTime: 9,
        endTime: 11.5,
        waveform: generateWaveform('mechanical', 50),
        label: '金属刮擦声 — 有东西擦过船体外部',
        isTarget: true,
        category: 'machine'
      },
      {
        id: 'ns1_sonar',
        startTime: 11.5,
        endTime: 14,
        waveform: generateWaveform('square', 50),
        label: '规律的声呐脉冲 — 方向：来自那个"生物"',
        isTarget: true,
        category: 'machine'
      },
      {
        id: 'ns1_crack',
        startTime: 14,
        endTime: 15.5,
        waveform: generateWaveform('noise', 30),
        label: '玻璃杯晃动',
        isTarget: false,
        category: 'human'
      }
    ],
    targetSegmentIds: ['ns1_scrape', 'ns1_sonar'],
    hints: ['注意听那些有固定节奏的声音', '自然生物不会发出完美规律的脉冲'],
    rewardClueId: 'clue_noise_external_contact',
    rewardEvidenceId: 'ev_noise_scrape',
    endingWeightModifiers: { ending_truth: 12, ending_survival: 8 }
  },
  {
    id: 'noise_2',
    title: '低语：舱内拾音',
    description: '直播关闭后的后台录音。除了船员的对话，还有什么被录下来了？隔离所有类别为"未知"和"加密"的片段。',
    difficulty: 'medium',
    targetCategory: 'encrypted',
    segments: [
      {
        id: 'ns2_zhou_talk',
        startTime: 0,
        endTime: 3,
        waveform: generateWaveform('voice', 60),
        label: '老周："协议07启动中..."',
        isTarget: false,
        category: 'human'
      },
      {
        id: 'ns2_radio',
        startTime: 3,
        endTime: 6.5,
        waveform: generateWaveform('sine', 70),
        label: '无线电嗡鸣声 — 协议07的频率',
        isTarget: false,
        category: 'machine'
      },
      {
        id: 'ns2_whisper_1',
        startTime: 6.5,
        endTime: 9,
        waveform: generateWaveform('creature', 50),
        label: '低频呢喃 — 无人说话时被录到，不在人声频率范围',
        isTarget: true,
        category: 'encrypted'
      },
      {
        id: 'ns2_su_breath',
        startTime: 9,
        endTime: 10.5,
        waveform: generateWaveform('noise', 30),
        label: '苏博士的急促呼吸',
        isTarget: false,
        category: 'human'
      },
      {
        id: 'ns2_data_burst',
        startTime: 10.5,
        endTime: 13,
        waveform: generateWaveform('square', 50),
        label: '数据突发传输 — 编码格式与深渊号系统不兼容',
        isTarget: true,
        category: 'encrypted'
      },
      {
        id: 'ns2_hull',
        startTime: 13,
        endTime: 15,
        waveform: generateWaveform('mechanical', 40),
        label: '船体减压释放阀',
        isTarget: false,
        category: 'machine'
      },
      {
        id: 'ns2_click_train',
        startTime: 15,
        endTime: 18,
        waveform: generateWaveform('square', 60),
        label: '高速点击序列 — 类似光学雷达的校准信号',
        isTarget: true,
        category: 'encrypted'
      },
      {
        id: 'ns2_xiaolin',
        startTime: 18,
        endTime: 20,
        waveform: generateWaveform('voice', 40),
        label: '小林："你们听到了吗...那个声音？"',
        isTarget: false,
        category: 'human'
      }
    ],
    targetSegmentIds: ['ns2_whisper_1', 'ns2_data_burst', 'ns2_click_train'],
    hints: ['仔细听那些在无人说话时出现的片段', '频率奇怪、节奏完美的声音最可疑'],
    rewardClueId: 'clue_noise_encrypted_comm',
    rewardEvidenceId: 'ev_noise_whisper',
    endingWeightModifiers: { ending_truth: 22, ending_madness: 15, ending_survival: 12, ending_silence: -10 }
  },
  {
    id: 'noise_3',
    title: '最后时刻：03:17:40 - 03:17:42',
    description: '信号中断前最后两秒的多轨录音。有人——或者说有东西——在最后一帧留下了信息。找到它。',
    difficulty: 'hard',
    targetCategory: 'encrypted',
    segments: [
      {
        id: 'ns3_alarm',
        startTime: 0,
        endTime: 0.5,
        waveform: generateWaveform('square', 30),
        label: '警报长鸣',
        isTarget: false,
        category: 'machine'
      },
      {
        id: 'ns3_zhou_yell',
        startTime: 0.5,
        endTime: 1,
        waveform: generateWaveform('voice', 30),
        label: '老周嘶吼："撑住！"',
        isTarget: false,
        category: 'human'
      },
      {
        id: 'ns3_static',
        startTime: 1,
        endTime: 1.4,
        waveform: generateWaveform('noise', 25),
        label: '信号干扰',
        isTarget: false,
        category: 'interference'
      },
      {
        id: 'ns3_ai_voice',
        startTime: 1.4,
        endTime: 1.8,
        waveform: generateWaveform('sine', 30),
        label: '合成语音片段 — 倒放后解码为 "THANK YOU FOR WATCHING"',
        isTarget: true,
        category: 'encrypted'
      },
      {
        id: 'ns3_crash',
        startTime: 1.8,
        endTime: 2,
        waveform: generateWaveform('noise', 15),
        label: '信号完全中断前的白噪声',
        isTarget: false,
        category: 'interference'
      },
      {
        id: 'ns3_subchannel',
        startTime: 0.8,
        endTime: 1.6,
        waveform: generateWaveform('creature', 50),
        label: '隐藏次声道 — 需要将音量放大到正常的64倍才能听到：一个自我介绍的声音',
        isTarget: true,
        category: 'encrypted'
      },
      {
        id: 'ns3_su_scream',
        startTime: 1.1,
        endTime: 1.5,
        waveform: generateWaveform('noise', 25),
        label: '苏博士的惊叫声',
        isTarget: false,
        category: 'human'
      },
      {
        id: 'ns3_header_ping',
        startTime: 0.2,
        endTime: 0.6,
        waveform: generateWaveform('square', 25),
        label: '数据包头部标识 — "深渊号AI系统"的握手协议',
        isTarget: true,
        category: 'encrypted'
      }
    ],
    targetSegmentIds: ['ns3_ai_voice', 'ns3_subchannel', 'ns3_header_ping'],
    hints: ['最后两秒信息量最大', '有些东西需要"反过来"听', '音量旋钮的尽头藏着秘密'],
    rewardClueId: 'clue_noise_ai_reveal',
    rewardEvidenceId: 'ev_noise_thank_you',
    endingWeightModifiers: { ending_truth: 35, ending_madness: 30, ending_loop: -20, ending_silence: -20 }
  }
];

export const subtitleChallenges: SubtitleChallenge[] = [
  {
    id: 'sub_1',
    title: '老周的异常报告',
    description: '这段老周的报告中混入了信号干扰导致的字幕错误。修正所有被损坏的文字，还原他真正说的话。',
    difficulty: 'easy',
    speaker: '老周',
    timestamp: '02:47:18',
    errors: [
      {
        id: 'se1_1',
        originalText: '声呐好像探测到什么东西',
        corruptedText: '声呐好像探测到什么**冻**西',
        correction: '东',
        errorType: 'homophone',
        wordIndex: 8
      },
      {
        id: 'se1_2',
        originalText: '体积很大，距离我们大约200米',
        corruptedText: '体**只**很大，距离我们大约200米',
        correction: '积',
        errorType: 'character_swap',
        wordIndex: 1
      },
      {
        id: 'se1_3',
        originalText: '移动方式不对，正在接近',
        corruptedText: '移动方式不对，正在**接进**',
        correction: '接近',
        errorType: 'character_swap',
        wordIndex: 7
      }
    ],
    rewardClueId: 'clue_sub_zhou_report',
    rewardEvidenceId: 'ev_sub_zhou_corrected',
    endingWeightModifiers: { ending_truth: 10, ending_survival: 8 }
  },
  {
    id: 'sub_2',
    title: '苏博士的坦白（被干扰段）',
    description: '苏博士在直播关闭后的对话被严重干扰。修复所有损坏的字幕，还原她真正想说的话。注意，有些错误会改变整句话的意思。',
    difficulty: 'medium',
    speaker: '苏博士',
    timestamp: '03:05:42',
    errors: [
      {
        id: 'se2_1',
        originalText: '它不是生物，是观测装置',
        corruptedText: '它不是生物，是**观**测装****置**',
        correction: '观装',
        errorType: 'missing_char',
        context: '缺少的字恰好组成了另一个关键词'
      },
      {
        id: 'se2_2',
        originalText: '三年前的先驱者号，我们也遇到了它',
        corruptedText: '三年前的先驱者号，我们也**遇**到了****他**',
        correction: '遇它',
        errorType: 'character_swap',
        context: '"他"和"它"的区别至关重要'
      },
      {
        id: 'se2_3',
        originalText: '公司对外宣称潜水器退役',
        corruptedText: '公司对外宣称潜水器**退**休**',
        correction: '退役',
        errorType: 'extra_char',
        context: '多出来的单人旁暗示了什么？'
      },
      {
        id: 'se2_4',
        originalText: '实际上是改装成了诱饵',
        corruptedText: '实际上是改**装**成了**诱**饵',
        correction: '装诱',
        errorType: 'missing_char',
        context: '缺失的部首连起来是"虫"——隐喻很深'
      }
    ],
    hiddenMessage: '将所有正确字组合：观测装置遇到它退役诱饵',
    rewardClueId: 'clue_sub_su_hidden_truth',
    rewardEvidenceId: 'ev_sub_su_bait',
    endingWeightModifiers: { ending_truth: 25, ending_survival: 15, ending_silence: -12 }
  },
  {
    id: 'sub_3',
    title: '小林的最后信息（加密字幕）',
    description: '小林在03:17:41发出了一条私人消息，但被系统严重损坏。据说这条消息是发给"外部"的。完整修复它——你只有一次机会。',
    difficulty: 'hard',
    speaker: '小林（加密私信）',
    timestamp: '03:17:41',
    errors: [
      {
        id: 'se3_1',
        originalText: 'PROJECT 07 IS WATCHING',
        corruptedText: 'P**OJE**T 07 IS W**TC**G',
        correction: 'ROJAHIN',
        errorType: 'missing_char',
        context: '缺失的字母按顺序是 OJ-E-AHI → 重新排列是 "HAIJOE"？不，是...'
      },
      {
        id: 'se3_2',
        originalText: 'THE AUDIENCE IS NOT REAL',
        corruptedText: 'TH**E AUD**CE IS NOT RE**L',
        correction: 'EENIA',
        errorType: 'missing_char',
        context: '缺失字母：E-E-N-I-A'
      },
      {
        id: 'se3_3',
        originalText: 'SIGNAL CUTOFF AT 03:17:42',
        corruptedText: 'SIGN**AL CUT**FF AT 0**3:17:42',
        correction: 'AOT',
        errorType: 'extra_char',
        context: '多余的字母是...不，这次是顺序错乱'
      },
      {
        id: 'se3_4',
        originalText: 'PLEASE TELL MY FAMILY I LOVE THEM',
        corruptedText: 'PLEASE TELL MY F**MILY I LOVE TH**M',
        correction: 'AE',
        errorType: 'character_swap',
        context: '这两行是小林真正想说的话，请帮他传达'
      },
      {
        id: 'se3_5',
        originalText: 'THIS RECORDING IS THE ONLY EVIDENCE',
        corruptedText: 'THIS** RECORDING IS THE ON**Y EV**DENCE',
        correction: 'LYI',
        errorType: 'missing_char',
        context: '小林拼尽全力留下的最后证据'
      }
    ],
    hiddenMessage: '完整信息：PROJECT 07 IS WATCHING / THE AUDIENCE IS NOT REAL / SIGNAL CUTOFF AT 03:17:42 / PLEASE TELL MY FAMILY I LOVE THEM / THIS RECORDING IS THE ONLY EVIDENCE',
    rewardClueId: 'clue_sub_kobayashi_evidence',
    rewardEvidenceId: 'ev_sub_final_message',
    endingWeightModifiers: { ending_truth: 45, ending_survival: 25, ending_madness: 25, ending_loop: -25, ending_silence: -30 }
  }
];

export const allSonarPatternIds = sonarChallenges.flatMap(c => c.targetPatternIds);
export const allNoiseSegmentIds = noiseChallenges.flatMap(c => c.targetSegmentIds);
export const allSubtitleErrorIds = subtitleChallenges.flatMap(c => c.errors.map(e => e.id));

export function getSonarChallenge(id: string): SonarChallenge | undefined {
  return sonarChallenges.find(c => c.id === id);
}

export function getNoiseChallenge(id: string): NoiseChallenge | undefined {
  return noiseChallenges.find(c => c.id === id);
}

export function getSubtitleChallenge(id: string): SubtitleChallenge | undefined {
  return subtitleChallenges.find(c => c.id === id);
}

export function getSonarPattern(challengeId: string, patternId: string): SonarPattern | undefined {
  const challenge = getSonarChallenge(challengeId);
  return challenge?.patterns.find(p => p.id === patternId);
}

export function getNoiseSegment(challengeId: string, segmentId: string): NoiseSegment | undefined {
  const challenge = getNoiseChallenge(challengeId);
  return challenge?.segments.find(s => s.id === segmentId);
}

export function getSubtitleError(challengeId: string, errorId: string): SubtitleError | undefined {
  const challenge = getSubtitleChallenge(challengeId);
  return challenge?.errors.find(e => e.id === errorId);
}
