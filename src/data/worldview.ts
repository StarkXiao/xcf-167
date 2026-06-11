import type {
  CreatureProfile,
  EquipmentLog,
  MailCorrespondence,
  ChronologyEvent,
  WorldviewNode,
  WorldviewCategory
} from '../types/game';

export const creatureProfiles: CreatureProfile[] = [
  {
    id: 'creature_siphonophorae',
    category: 'creature',
    title: '管水母群',
    subtitle: 'Siphonophorae Cluster',
    summary: '深度800米处观测到的管水母群体，发出幽蓝生物荧光。',
    content: '深渊号在下潜至800米深度时，左舷观测到一群管水母。该生物群体在完全黑暗的环境中通过生物荧光发出幽蓝色光芒，是深海生态系统中的常见掠食者。管水母并非单一生物，而是由无数个高度特化的水螅体和水母体组成的群落，它们在基因上完全相同，但功能各异——有的负责捕食，有的负责游泳，有的负责发光。',
    icon: '🪼',
    order: 1,
    scientificName: 'Siphonophorae',
    depthRange: '200m - 1,000m',
    classification: 'biological',
    threatLevel: 1,
    firstSighted: '2047-06-12 · 00:45',
    physicalDescription: '群体长度可达数十米，呈半透明凝胶状，触手带有刺细胞。生物荧光器官沿身体对称分布。',
    behavioralNotes: '以浮游生物和小型鱼类为食，通常不主动攻击大型目标。其荧光可能用于诱捕猎物或群体间通讯。',
    tags: ['深海生物', '生物荧光', '群落生物'],
    parentNodeId: 'chrono_abyss_mission',
    relatedNodeIds: ['equip_sonar_system', 'equip_camera_system']
  },
  {
    id: 'creature_anomaly_alpha',
    category: 'creature',
    title: '不明巨型物体 · 初号观测',
    subtitle: 'Unknown Mass · Alpha Contact',
    summary: '深度1500米处首次被声呐捕捉到的巨大异常信号源。',
    content: '深渊号深度达到1500米时，工程师老周报告声呐探测到体积巨大的不明物体。该物体距潜水器约200米，其移动方式不符合任何已知海洋生物的游动特征——它既不像鱼类摆尾，也不像水母收缩，更像是一种...滑行。苏博士最初推测可能是鲸群，但该深度超出了已知鲸类的活动范围。',
    icon: '🔊',
    order: 2,
    depthRange: '1,500m - 3,200m+',
    classification: 'unknown',
    threatLevel: 3,
    firstSighted: '2047-06-12 · 01:15',
    physicalDescription: '声呐回波显示其体积约为深渊号的3倍，整体呈流线型。具体形态未知。',
    behavioralNotes: '持续接近潜水器，移动速度缓慢但稳定，没有表现出攻击或逃避意图。',
    tags: ['不明生物', '声呐异常', '首次接触'],
    requiresClues: ['clue_early'],
    parentNodeId: 'creature_siphonophorae',
    relatedNodeIds: ['equip_sonar_system', 'chrono_creature_sighting']
  },
  {
    id: 'creature_anomaly_beta',
    category: 'creature',
    title: '舷窗闪影',
    subtitle: 'Portside Silhouette',
    summary: '深度3200米处舷窗外短暂出现的巨大黑影。',
    content: '深渊号深度达到3200米时，灯光照射范围外的画面边缘闪过一个影子。老周报告声呐目标已接近至80米。该影子出现时间极短，不足0.3秒，但画面增强处理后可以辨认出其大致轮廓——不是鱼类的轮廓，而是某种对称的、近乎几何形状的结构。',
    icon: '👁',
    order: 3,
    depthRange: '3,200m',
    classification: 'unknown',
    threatLevel: 4,
    firstSighted: '2047-06-12 · 01:50',
    physicalDescription: '画面增强后显示轮廓具有几何对称性，边缘呈锐角而非生物曲线。',
    behavioralNotes: '在潜水器灯光范围边缘移动，似乎在规避直接照射，但又不愿远离。',
    tags: ['视觉目击', '几何轮廓', '规避行为'],
    requiresClues: ['saw_creature'],
    parentNodeId: 'creature_anomaly_alpha',
    relatedNodeIds: ['equip_camera_system', 'chrono_abyss_mission']
  },
  {
    id: 'creature_anomaly_gamma',
    category: 'creature',
    title: '深渊观测体',
    subtitle: 'Abyssal Observer',
    summary: '灯光照射下显现的巨大机械生物混合体，拥有人造镜头结构。',
    content: '深渊号将灯光打向那个方向时，所有人都看到了它——一个三倍于潜水器大小的巨大物体悬浮在黑暗中。它有一双"眼睛"，或者说，类似眼睛的结构，正盯着潜水器。但放大600%后的画面显示，那不是眼睛——那是镜头。一个人造的、冰冷的、巨大的镜头。它的"皮肤"上有明显的工业焊接痕迹，还有一串模糊的编号：P-R-O-J-E-C-T-...',
    icon: '🔭',
    order: 4,
    depthRange: '3,200m - 未知',
    classification: 'artificial',
    threatLevel: 5,
    firstSighted: '2047-06-12 · 02:20',
    physicalDescription: '整体呈流线型，表面有工业焊接痕迹。"眼部"结构被确认为光学观测镜头，尺寸约为成年人身高的两倍。编号开头为PROJECT。',
    behavioralNotes: '在被强光照射后静止不动，持续观测潜水器内部。对潜水器的动作有即时反应，显示其具备实时感知能力。在特定频率信号刺激下会产生后退反应。',
    tags: ['人造观测体', '协议07', '验收机制', '机械生物'],
    requiresClues: ['clue_creature', 'clue_creature_artificial'],
    parentNodeId: 'creature_anomaly_beta',
    relatedNodeIds: ['equip_protocol_module', 'chrono_pioneer_incident']
  },
  {
    id: 'creature_protocol_link',
    category: 'creature',
    title: '协议07 · 验收机制',
    subtitle: 'Protocol 07 · Acceptance Mechanism',
    summary: '深渊观测体的真实身份——协议07核心部分，用于测试特定条件的"验收装置"。',
    content: '苏博士在直播最后阶段的坦白揭示了真相：那个东西不是生物，至少不全是生物。它是协议07的"验收机制"——一个深海观测装置，用于评估特定条件下人类群体的反应。直播信号不仅是对外传输的，也是它接收数据的通道。协议07的特定频率信号能让它后退，但那不是防御，而是"验收暂停"的指令。',
    icon: '⚙️',
    order: 5,
    classification: 'hybrid',
    threatLevel: 5,
    physicalDescription: '生物机械混合结构。外壳疑似采用深海生物组织与金属合金复合工艺制造，内部核心为人造观测与计算系统。',
    behavioralNotes: '其行为模式符合自动化观测程序特征。后退反应可能基于协议频率触发的优先级指令。在直播关闭后可能因"观测目标消失"而终止接触。',
    tags: ['协议07', '验收机制', '生物机械', '核心真相'],
    requiresClues: ['clue_acceptance_mechanism', 'full_truth'],
    parentNodeId: 'creature_anomaly_gamma',
    relatedNodeIds: ['equip_protocol_module', 'chrono_project_init', 'mail_su_agreement']
  }
];

export const equipmentLogs: EquipmentLog[] = [
  {
    id: 'equip_abyss_sub',
    category: 'equipment',
    title: '深渊号载人潜水器',
    subtitle: 'Abyss-Class Manned Submersible',
    summary: '本次任务使用的深海载人潜水器，可搭载4人下潜至万米深度。',
    content: '深渊号是第三代深海载人潜水器，官方标称最大下潜深度11,000米。潜水器采用三层耐压壳设计，配备高清外拍摄像系统、主动声呐、紧急上浮舱等标准设备。可搭载4名船员连续作业72小时。',
    icon: '🚢',
    order: 1,
    model: 'DEEP-ABYSS MK-III',
    manufacturer: '深海探索技术公司',
    deployDate: '2047-06-12',
    status: 'destroyed',
    specs: {
      '全长': '8.5米',
      '最大下潜深度': '11,000m',
      '乘员数量': '4人',
      '自持力': '72小时',
      '动力系统': '固态电池组 + 螺旋桨推进',
      '外壳材质': '钛合金 + 纳米陶瓷复合层'
    },
    tags: ['潜水器', '深渊号', '主装备'],
    parentNodeId: 'chrono_abyss_mission',
    relatedNodeIds: ['chrono_pioneer_incident', 'mail_recruitment_ahai']
  },
  {
    id: 'equip_abyss_id',
    category: 'equipment',
    title: '深渊号 · 编号异常',
    subtitle: 'Vessel Identification Anomaly',
    summary: '深渊号船体编号与三年前"已退役拆解"的先驱者号高度吻合。',
    content: '直播弹幕中ID为"内部人士07"的观众指出：深渊号的编号不对，这艘船本应在2044年就被拆解了。后续调查证实，深渊号的龙骨序列号、液压系统编号、甚至部分舱室标记都与先驱者号完全匹配。所谓的"退役拆解"只是掩人耳目的说法——先驱者号被秘密修复和改装后，以深渊号的名义重新投入使用。',
    icon: '🔢',
    order: 2,
    model: 'DEEP-PIONEER MK-II (Renamed)',
    status: 'classified',
    specs: {
      '原始编号': 'DEEP-PIONEER 2041',
      '重新编号': 'DEEP-ABYSS 2047',
      '改装时间': '2045-2046',
      '改装内容': '外拍摄像系统升级、AI观测系统加装、协议07响应模块植入'
    },
    tags: ['编号异常', '先驱者号', '机密改装'],
    requiresClues: ['clue_danmaku_deep'],
    parentNodeId: 'equip_abyss_sub',
    relatedNodeIds: ['chrono_abyss_rebuild', 'chrono_pioneer_incident']
  },
  {
    id: 'equip_escape_pod',
    category: 'equipment',
    title: '独立紧急上浮舱',
    subtitle: 'Independent Emergency Ascent Pod',
    summary: '老周秘密加装的后手——可脱离主艇体的双人紧急上浮舱。',
    content: '老周在建造（改装）深渊号时，在外层抗压壳的第三舱段秘密留了一手：一个独立的紧急上浮舱，可以脱离主艇体单独上浮。该上浮舱只能容纳两人，配备独立压缩氧气瓶和被动浮力装置，不需要电力即可上浮。老周从未在官方文档中记录过这个改装，因为他知道这可能违反公司规定——或者说，他知道公司可能不希望所有人都能活着回来。',
    icon: '🛟',
    order: 3,
    model: 'IEAP-2 (Unofficial Mod)',
    status: 'classified',
    specs: {
      '容量': '2人',
      '供氧时长': '8小时',
      '上浮方式': '被动浮力 + 压缩空气助推',
      '通讯设备': '紧急定位信标',
      '设计者/安装者': '老周（私自改装）'
    },
    tags: ['紧急上浮', '老周的后手', '私自改装'],
    requiresClues: ['clue_engineer_secret'],
    parentNodeId: 'equip_abyss_sub',
    relatedNodeIds: ['mail_zhou_family', 'mail_zhou_retirement']
  },
  {
    id: 'equip_sonar_system',
    category: 'equipment',
    title: '声呐系统',
    subtitle: 'Sonar Array System',
    summary: '深渊号搭载的主动/被动声呐系统，记录了多次异常回波。',
    content: '深渊号配备的多波束声呐系统能够同时进行主动探测和被动监听。在本次任务中，声呐系统多次记录到非生物特征的异常回波——这些回波的频率模式过于规律，不像鲸类或鱼群的生物信号，更像是...另一个声呐系统在回应。声呐系统在深渊观测体近距离接触后遭受严重电磁干扰，最终完全失效。',
    icon: '📡',
    order: 4,
    model: 'SAS-DEEP-9000',
    status: 'destroyed',
    specs: {
      '主动探测范围': '500m',
      '被动监听范围': '5,000m',
      '频率范围': '1kHz - 50kHz',
      '探测精度': '±0.5m'
    },
    maintenanceLogs: [
      { date: '2047-06-10', entry: '下潜前检测，所有模块正常。注意：被动监听模块灵敏度较上次校准提高了15%，原因不明。' },
      { date: '2047-06-12 · 01:15', entry: '首次检测到异常回波，频率特征未匹配数据库记录。' },
      { date: '2047-06-12 · 02:20', entry: '近距离接触后系统过载，开始出现间歇性失效。' }
    ],
    tags: ['声呐', '异常回波', '电磁干扰'],
    parentNodeId: 'equip_abyss_sub',
    relatedNodeIds: ['creature_anomaly_alpha', 'creature_anomaly_gamma']
  },
  {
    id: 'equip_camera_system',
    category: 'equipment',
    title: '直播摄像系统',
    subtitle: 'Live Broadcast Camera System',
    summary: '多机位深海直播摄像系统，由摄影师小林操作。',
    content: '深渊号搭载4台深海高清摄像机，分别位于舷窗内侧、艇首、艇尾和艇顶。所有画面实时传输至水面转播船，再分发至各直播平台。小林作为专职摄影师，负责镜头切换和画面调色。直播中断前，舷窗内侧主摄像机捕捉到了深渊观测体"睁开眼睛"——即启动光学观测镜头——的瞬间。',
    icon: '📹',
    order: 5,
    model: 'BCAM-DEEP-X4',
    status: 'destroyed',
    specs: {
      '摄像机数量': '4台',
      '分辨率': '4K @ 60fps',
      '最大工作深度': '12,000m',
      '低光灵敏度': '0.0001 lux',
      '数据传输': '光纤直连 + 无线备份'
    },
    operatorId: 'xiaolin',
    tags: ['直播系统', '摄像机', '小林'],
    parentNodeId: 'equip_abyss_sub',
    relatedNodeIds: ['creature_anomaly_beta', 'creature_anomaly_gamma', 'mail_recruitment_ahai']
  },
  {
    id: 'equip_protocol_module',
    category: 'equipment',
    title: '协议07响应模块',
    subtitle: 'Protocol 07 Response Module',
    summary: '植入深渊号通讯系统的加密频率发射装置，可触发特定信号。',
    content: '在先驱者号的改装过程中，深渊号（原先驱者号）的通讯系统被秘密植入了一个特殊模块——协议07响应模块。该模块能够发射一组特定频率的无线电信号，这些信号能够被深渊观测体识别并触发"后退"反应。苏博士和老周是唯一知道这个模块存在的船员。这个模块的真实用途——是防御装置，还是验收机制的遥控器——仍然存疑。',
    icon: '📶',
    order: 6,
    model: 'PRM-07 (Classified)',
    status: 'classified',
    specs: {
      '发射频率': '机密',
      '信号模式': '加密脉冲序列',
      '激活方式': '物理开关（苏博士舱位下方）',
      '有效范围': '约300m（水下）'
    },
    tags: ['协议07', '加密装置', '验收机制'],
    requiresClues: ['clue_protocol07', 'clue_previous_incident'],
    parentNodeId: 'equip_abyss_id',
    relatedNodeIds: ['creature_protocol_link', 'chrono_project_init', 'mail_su_agreement']
  }
];

export const mailCorrespondences: MailCorrespondence[] = [
  {
    id: 'mail_recruitment_ahai',
    category: 'mail',
    title: '任务邀请函',
    from: '深海探索公司 · 项目协调部',
    to: '阿海（主播）',
    date: '2047-05-20',
    subject: '【重要】关于马里亚纳海沟深度直播合作邀请',
    summary: '深海探索公司邀请阿海进行万米深度全程直播的合作邮件。',
    content: '尊敬的阿海先生：\n\n您好。我司诚挚邀请您作为首席主播，参与将于6月执行的马里亚纳海沟万米深度全程直播项目。本次直播将是人类历史上首次在该深度进行的实时公开传播，预计全网观看人数将突破千万级。\n\n合作费用将按照您方报价的150%支付，另加事故保险。详细合同附件已上传至加密通道。\n\n请注意：本次任务的船员名单和设备参数均属于商业机密，请签署NDA后方可查看。\n\n期待您的回复。\n\n——深海探索技术公司 · 项目协调部',
    icon: '📨',
    order: 1,
    securityLevel: 'internal',
    tags: ['合作邀请', '阿海', '商业机密'],
    parentNodeId: 'chrono_crew_recruit',
    relatedNodeIds: ['equip_abyss_sub', 'chrono_abyss_mission']
  },
  {
    id: 'mail_contract_clause',
    category: 'mail',
    title: '合同附件 · 第7条',
    from: '深海探索公司 · 法务部',
    to: '阿海（主播）',
    date: '2047-06-01',
    subject: 'RE: 合同第7条补充说明',
    summary: '关于合同中被标记为"不可抗力条款"的协议07的说明邮件。',
    content: '阿海先生您好：\n\n关于您询问的合同第7条"特殊情况处置条款"，法务部答复如下：\n\n该条款（又称协议07）为我司所有深海任务的标准附加条款，涵盖在极端不可抗情况下的公司免责范围。简单来说，如果直播过程中出现非设备故障、非人为操作失误导致的信号中断或人员失联，我司将按照最高额度保险进行赔付，不承担额外责任。\n\n此类条款在深海勘探行业是标准操作，请您放心。本次任务的设备安全记录是行业最优的。\n\n如有其他疑问请随时联系。\n\n——深海探索技术公司 · 法务部',
    icon: '📄',
    order: 2,
    securityLevel: 'restricted',
    tags: ['协议07', '合同', '阿海'],
    requiresClues: ['clue_protocol07'],
    parentNodeId: 'mail_recruitment_ahai',
    relatedNodeIds: ['equip_protocol_module', 'creature_protocol_link']
  },
  {
    id: 'mail_zhou_family',
    category: 'mail',
    title: '老周与儿子的通信',
    from: '老周的儿子',
    to: '老周（工程师）',
    date: '2047-06-11',
    subject: '爸',
    summary: '老周儿子在任务前一天发来的简短邮件，字里行间充满担忧。',
    content: '爸：\n\n你答应过我这次是最后一次。\n\n我知道你不能说具体在做什么，但妈和我都很担心。上次的事情之后，你说过再也不下潜了。\n\n不管发生什么，记得你答应我的——要活着回来。\n\n如果有任何不对劲，不管合同、不管公司，保命要紧。\n\n等你回家。\n\n——你儿子',
    icon: '💌',
    order: 3,
    securityLevel: 'public',
    threadId: 'thread_family_zhou',
    tags: ['老周', '家人', '担忧'],
    requiresClues: ['clue_danmaku_deep'],
    parentNodeId: 'chrono_crew_recruit',
    relatedNodeIds: ['equip_escape_pod', 'chrono_pioneer_incident']
  },
  {
    id: 'mail_su_agreement',
    category: 'mail',
    title: '苏博士 · 旧约',
    from: '未知发送者',
    to: '苏博士',
    date: '2044-03-20',
    subject: '关于上次的事',
    summary: '先驱者号事故后五天，苏博士收到的神秘邮件，提到了"我们的约定"。',
    content: '苏：\n\n你做得很好。那些数据很有价值。\n\n你知道为什么我们救你和老周上来，而不是另外那两个。不是因为你们更有价值——是因为你们更懂得闭嘴。\n\n这次的验收参数需要调整，它的反应比我们预想的更激烈。下一次，我们需要更多数据。\n\n别忘了我们的约定。你知道违背约定的后果。\n\n——07',
    icon: '🔏',
    order: 4,
    securityLevel: 'classified',
    tags: ['苏博士', '协议07', '先驱者号', '威胁'],
    requiresClues: ['clue_previous_incident', 'clue_protocol07'],
    parentNodeId: 'chrono_pioneer_incident',
    relatedNodeIds: ['creature_protocol_link', 'equip_protocol_module', 'chrono_project_init']
  },
  {
    id: 'mail_zhou_retirement',
    category: 'mail',
    title: '老周的退休申请',
    from: '老周（工程师）',
    to: '深海探索公司 · 人力资源部',
    date: '2047-05-15',
    subject: '退休申请',
    summary: '老周在本次任务前一个月提交的退休申请，被公司以"特殊任务需要"为由拒绝。',
    content: '人力资源部您好：\n\n本人周XX（工号ENG-00417），现正式提交退休申请。\n\n本人自2022年入职以来，已在深海工程领域工作25年，参与包括先驱者号、深渊号在内的多型潜水器设计与维护工作。根据公司员工手册，年满55岁且工龄满25年可申请提前退休。\n\n本人健康状况近年有所下降，已不适合继续执行深海任务。\n\n望批准。\n\n——周XX',
    icon: '📋',
    order: 5,
    securityLevel: 'internal',
    threadId: 'thread_retirement_zhou',
    tags: ['老周', '退休', '被拒绝'],
    parentNodeId: 'chrono_crew_recruit',
    relatedNodeIds: ['equip_escape_pod', 'mail_zhou_family']
  },
  {
    id: 'mail_zhou_retirement_reply',
    category: 'mail',
    title: '退休申请批复',
    from: '深海探索公司 · 人力资源部',
    to: '老周（工程师）',
    date: '2047-05-18',
    subject: 'RE: 退休申请',
    summary: '公司拒绝了老周的退休申请，要求他"完成最后一次任务后再议"。',
    content: '周工您好：\n\n您的退休申请已收悉。\n\n经管理层讨论，考虑到您是深渊号项目的核心技术人员，且6月份的马里亚纳海沟任务已进入最终筹备阶段，您的技术经验不可替代。公司决定暂不批准您的退休申请。\n\n本次任务完成后，公司将重新评估您的申请，并考虑为您颁发"终身贡献奖"及相应的额外退休金。\n\n感谢您的理解与奉献。\n\n——深海探索技术公司 · 人力资源部',
    icon: '❌',
    order: 6,
    securityLevel: 'internal',
    replyToMailId: 'mail_zhou_retirement',
    threadId: 'thread_retirement_zhou',
    tags: ['老周', '退休', '被拒绝', '强制留任'],
    parentNodeId: 'mail_zhou_retirement',
    relatedNodeIds: ['chrono_abyss_mission', 'equip_escape_pod']
  },
  {
    id: 'mail_anonymous_data',
    category: 'mail',
    title: '匿名邮件 · 数据包',
    from: '匿名发送者',
    to: '数字取证分析师（你）',
    date: '2047-09-15',
    subject: '你需要看看这个',
    summary: '三个月后，匿名发送者将深渊号完整直播数据发送到你邮箱的邮件。',
    content: '你好，取证分析师：\n\n或者，我应该叫你"观众"？\n\n附件是深渊号DEEP-2047-0612任务的完整直播数据备份。不是官方公布的那版被剪辑过的——是原始的、未经删改的完整数据流，包括弹幕后台日志、声呐原始记录、以及所有被管理员删除的内容。\n\n三个月前，两百万人同时看着四个人走向深渊。官方说那是一场意外。你觉得呢？\n\n看看这些数据。然后自己判断。\n\n——一个知道内情的人\n\nPS：别试图追踪来源。你找不到我的。但如果有什么发现...你会知道该怎么做的。',
    icon: '🕶',
    order: 7,
    securityLevel: 'classified',
    attachments: ['DEEP-2047-0612_FULL_RAW.zip.enc'],
    tags: ['你', '匿名发送者', '完整数据', '游戏开端'],
    parentNodeId: 'chrono_you_receive',
    relatedNodeIds: ['chrono_abyss_mission', 'chrono_coverup']
  }
];

export const chronologyEvents: ChronologyEvent[] = [
  {
    id: 'chrono_project_init',
    category: 'chronology',
    title: '项目启动',
    summary: '协议07项目正式立项，深渊观测体开始研发。',
    content: '深海探索技术公司内部立项"协议07"项目，目标是研发能够在极端深度环境下工作的自主观测系统。项目初期代号"深渊之眼"，预算规模属公司最高机密等级。',
    icon: '🎯',
    order: 1,
    eventDate: '2038',
    location: '深海探索公司 · 总部',
    eventType: 'research',
    involvedParties: ['深海探索公司', '协议07项目组'],
    tags: ['项目起源', '协议07', '公司背景'],
    relatedNodeIds: ['equip_protocol_module', 'creature_protocol_link']
  },
  {
    id: 'chrono_creature_sighting',
    category: 'chronology',
    title: '首次深渊目击',
    summary: '在8,500米深度无人探测器首次拍到不明巨型物体。',
    content: '深海探索公司的无人探测器"探索者-VII"在马里亚纳海沟8,500米深度执行常规勘测时，意外拍摄到一个体积巨大的不明物体。该物体在被探测器灯光照射后迅速消失。回传的画面因信号干扰大部分损坏，但幸存的几帧图像显示了非自然形成的几何轮廓。该数据被公司列为最高机密。',
    icon: '📸',
    order: 2,
    eventDate: '2040-08',
    location: '马里亚纳海沟 · 8,500m',
    depth: '8,500m',
    eventType: 'discovery',
    involvedParties: ['探索者-VII无人探测器'],
    tags: ['首次目击', '深渊观测体', '无人探测器'],
    parentNodeId: 'chrono_project_init',
    relatedNodeIds: ['creature_anomaly_alpha']
  },
  {
    id: 'chrono_pioneer_built',
    category: 'chronology',
    title: '先驱者号建成',
    summary: '先驱者号载人潜水器建造完成，内部秘密植入协议07相关设备。',
    content: '先驱者号（DEEP-PIONEER MK-II）建造完成并交付。官方宣传为最新型深海勘测潜水器。实际上，在建造过程中已秘密植入了协议07响应模块以及额外的数据传输设备——这些设备能够将潜水器内部的所有画面和声音实时传输给某个隐藏的接收方，独立于官方直播通道。',
    icon: '🛳',
    order: 3,
    eventDate: '2041',
    location: '深海探索公司 · 造船厂',
    eventType: 'research',
    involvedParties: ['深海探索公司', '老周', '苏博士'],
    tags: ['先驱者号', '建造', '秘密改装'],
    parentNodeId: 'chrono_creature_sighting',
    relatedNodeIds: ['equip_abyss_id']
  },
  {
    id: 'chrono_pioneer_incident',
    category: 'chronology',
    title: '先驱者号事故',
    summary: '先驱者号在8,500米深度与深渊观测体接触，2人留守失联，2人幸存上浮。',
    content: '先驱者号执行马里亚纳海沟勘测任务，在8,500米深度与深渊观测体发生近距离接触。船体严重受损，通信中断。苏博士与老周启动协议07，特定频率信号使观测体暂时后退。最终老周设计的紧急上浮方案让苏博士和老周成功脱险，另外两名留守人员至今下落不明。官方对外宣布为"机械故障导致的沉没事故"，并宣称全体船员获救。先驱者号被宣告退役拆解。',
    icon: '⚠️',
    order: 4,
    eventDate: '2044-03-15',
    eventTime: 'T+03:40 ~ T+05:30',
    location: '马里亚纳海沟 · 8,500m',
    depth: '8,500m',
    eventType: 'incident',
    involvedParties: ['先驱者号', '老周', '苏博士', '两名未公开姓名船员'],
    consequence: '2人失踪（官方宣称全部获救），先驱者号"退役"，协议07项目数据不足需二次测试。',
    tags: ['先驱者号', '事故', '首次接触', '掩盖真相'],
    evidenceRefs: ['case_pioneer_2044'],
    parentNodeId: 'chrono_pioneer_built',
    relatedNodeIds: ['creature_anomaly_gamma', 'equip_protocol_module', 'mail_su_agreement']
  },
  {
    id: 'chrono_abyss_rebuild',
    category: 'chronology',
    title: '深渊号改装',
    summary: '先驱者号被秘密修复并改装为深渊号，加装AI观测系统。',
    content: '被宣告"退役拆解"的先驱者号实际上被秘密运往隐蔽船坞，进行了为期两年的大修和改装。改装内容包括：外拍摄像系统升级为4K直播规格、AI观测系统加装（用于实时分析船员状态和弹幕内容）、协议07响应模块优化（缩短信号延迟）。改装完成后，船体重新编号为深渊号（DEEP-ABYSS MK-III）。',
    icon: '🔧',
    order: 5,
    eventDate: '2045 - 2046',
    location: '未公开船坞',
    eventType: 'classified',
    involvedParties: ['深海探索公司', '老周', '协议07项目组'],
    tags: ['深渊号', '改装', 'AI系统', '秘密作业'],
    requiresClues: ['clue_previous_incident'],
    parentNodeId: 'chrono_pioneer_incident',
    relatedNodeIds: ['equip_abyss_id', 'equip_protocol_module']
  },
  {
    id: 'chrono_crew_recruit',
    category: 'chronology',
    title: '船员招募',
    summary: '深渊号任务船员名单确定，包括主播阿海和摄影师小林。',
    content: '深渊号任务船员名单最终确定：主播阿海（外部合作，负责直播主持）、摄影师小林（外部合作，负责直播摄像）、工程师老周（公司内部，负责设备维护与紧急上浮）、海洋生物学家苏博士（公司内部，负责协议07相关流程）。其中老周的退休申请被拒绝，苏博士是"自愿"参加——两人都清楚这次任务的真实目的。',
    icon: '👥',
    order: 6,
    eventDate: '2047-05',
    eventType: 'operation',
    involvedParties: ['阿海', '小林', '老周', '苏博士'],
    tags: ['船员', '招募', '任务准备'],
    parentNodeId: 'chrono_abyss_rebuild',
    relatedNodeIds: ['mail_recruitment_ahai', 'mail_zhou_retirement', 'mail_zhou_family']
  },
  {
    id: 'chrono_abyss_mission',
    category: 'chronology',
    title: '深渊号直播任务',
    summary: '深渊号执行万米深度全程直播任务，与深渊观测体发生第二次接触。',
    content: '深渊号载着4名船员和280万在线观众，开始了人类历史上首次马里亚纳海沟万米深度全程直播。下潜过程中遭遇深渊观测体（协议07验收机制）的近距离接触。船员们在直播中产生严重分歧：苏博士和老周要求关闭直播以触发验收暂停，阿海因合同条款坚持继续。最终信号在03:17:42永久中断。',
    icon: '📺',
    order: 7,
    eventDate: '2047-06-12',
    eventTime: '00:00 ~ 03:17:42',
    location: '马里亚纳海沟 · 10,000m+',
    depth: '10,000m+',
    eventType: 'incident',
    involvedParties: ['深渊号', '阿海', '小林', '老周', '苏博士', '深渊观测体', '2,847,291名观众'],
    consequence: '信号永久中断，4名船员失联，官方定性为"深海意外事故"。',
    evidenceRefs: ['case_abyss_2047'],
    tags: ['深渊号', '直播任务', '第二次接触', '信号中断'],
    parentNodeId: 'chrono_crew_recruit',
    relatedNodeIds: ['creature_siphonophorae', 'creature_anomaly_beta', 'equip_abyss_sub', 'equip_camera_system']
  },
  {
    id: 'chrono_coverup',
    category: 'chronology',
    title: '官方掩盖',
    summary: '官方发布事故调查报告，将事件定性为极端水压导致的设备故障。',
    content: '深海探索技术公司联合相关部门召开新闻发布会，公布深渊号事故"调查报告"。报告将事故原因定性为"极端水压导致的耐压壳意外破损"，与任何"不明生物"或"阴谋论"无关。直播录像经过剪辑后作为证据提交，所有异常弹幕和声呐数据被移除。相关话题在网络平台被限流处理。',
    icon: '🕶',
    order: 8,
    eventDate: '2047-06-15',
    eventType: 'classified',
    involvedParties: ['深海探索公司', '公关团队'],
    consequence: '公众逐渐遗忘事件，仅有少数质疑声音被淹没。',
    tags: ['掩盖', '公关', '官方报告'],
    parentNodeId: 'chrono_abyss_mission',
    relatedNodeIds: ['mail_anonymous_data']
  },
  {
    id: 'chrono_you_receive',
    category: 'chronology',
    title: '你的介入',
    summary: '作为数字取证分析师的你收到匿名邮件，内含完整原始直播数据。',
    content: '事故发生三个月后，你——一名数字取证分析师——收到了一封匿名邮件。附件是深渊号任务的完整原始直播数据备份，包括所有被删除的弹幕、声呐原始记录、以及多轨未公开音频。这就是你现在正在看的一切的开始。你会发现真相吗？你会做出什么选择？',
    icon: '💾',
    order: 9,
    eventDate: '2047-09-15',
    eventType: 'discovery',
    involvedParties: ['你（数字取证分析师）', '匿名发送者'],
    tags: ['你', '匿名邮件', '游戏开始'],
    evidenceRefs: ['mail_anonymous_data'],
    parentNodeId: 'chrono_coverup',
    relatedNodeIds: ['mail_anonymous_data']
  },
  {
    id: 'chrono_ai_awareness',
    category: 'chronology',
    title: '深渊号AI系统',
    summary: '直播最后一帧弹幕显示深渊号AI系统在直播开始前两小时就已发送"谢谢你一直看到最后"。',
    content: '对完整原始数据的时间戳分析揭示了一个诡异的事实：直播中断前最后一帧弹幕——发送者为"深渊号AI系统"，内容为"谢谢你一直看到最后"——的实际发送时间是2047-06-11 25:17:42，比直播正式开始早了整整两小时。深渊号的AI系统究竟是什么？它是预测了结局，还是...安排了结局？',
    icon: '🤖',
    order: 10,
    eventDate: '时间戳异常',
    eventType: 'classified',
    involvedParties: ['深渊号AI系统'],
    tags: ['AI系统', '时间异常', '终极谜团'],
    requiresClues: ['clue_loop_awareness', 'full_truth'],
    parentNodeId: 'chrono_you_receive',
    relatedNodeIds: ['creature_protocol_link', 'equip_protocol_module']
  }
];

export const allWorldviewNodes: WorldviewNode[] = [
  ...creatureProfiles,
  ...equipmentLogs,
  ...mailCorrespondences,
  ...chronologyEvents
];

export const worldviewRootNodeIds: string[] = ['chrono_project_init', 'chrono_you_receive'];

export function getNodesByCategory(category: WorldviewCategory): WorldviewNode[] {
  return allWorldviewNodes.filter(n => n.category === category).sort((a, b) => a.order - b.order);
}

export function getNodeById(id: string): WorldviewNode | undefined {
  return allWorldviewNodes.find(n => n.id === id);
}

export function getCreatureById(id: string): CreatureProfile | undefined {
  return creatureProfiles.find(c => c.id === id);
}

export function getEquipmentById(id: string): EquipmentLog | undefined {
  return equipmentLogs.find(e => e.id === id);
}

export function getMailById(id: string): MailCorrespondence | undefined {
  return mailCorrespondences.find(m => m.id === id);
}

export function getChronologyById(id: string): ChronologyEvent | undefined {
  return chronologyEvents.find(c => c.id === id);
}

export function getChildNodes(nodeId: string): WorldviewNode[] {
  return allWorldviewNodes.filter(n => n.parentNodeId === nodeId);
}

export function getRelatedNodes(nodeIds: string[]): WorldviewNode[] {
  return allWorldviewNodes.filter(n => n.relatedNodeIds?.some(id => nodeIds.includes(id)));
}

export const categoryLabels: Record<WorldviewCategory, string> = {
  creature: '生物档案',
  equipment: '装备日志',
  mail: '邮件往来',
  chronology: '事件年表'
};

export const categoryIcons: Record<WorldviewCategory, string> = {
  creature: '🐙',
  equipment: '⚙️',
  mail: '✉️',
  chronology: '📅'
};

export const categoryColors: Record<WorldviewCategory, string> = {
  creature: '#66ddaa',
  equipment: '#66aaff',
  mail: '#ddaa66',
  chronology: '#aa88ff'
};
