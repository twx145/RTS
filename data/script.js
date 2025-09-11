window.scriptData = {
  "title": "神盾计划",
  "chapters": [// 新增教程章节
    {
      "id": "tutorial",
      "title": "教程：基本操作",
      "scenes": [
        {
          "id": "tutorial_1",
          "name": "欢迎",
          "background": "bg.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "欢迎，指挥官。在开始任务之前，让我们先进行基本操作训练。",
              "voice": "eva_briefing1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "首先，学习如何部署和移动你的部队。",
              "voice": "eva_briefing2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始教程任务",
                "mapId": "map_tutorial", // 教程地图
                "availableUnits": ["assault_infantry"], // 只允许部署突击步兵
                "enableFogOfWar": false,
                "aiDifficulty": "easy",
                "gameMode": "tutorial" ,
                "playerManpower": 30, // 玩家兵力
                "aiManpower": 15,
                "aiDeployments": [
                    { "type": "assault_infantry", "x": 25, "y": 28 },
                    { "type": "assault_infantry", "x": 25, "y": 22 },
                    { "type": "sniper", "x": 25, "y": 20 }
                ]
              }
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "恭喜你，指挥官。现在你已经大致掌握了基本操作，我们即将进行第一次任务。",
              "voice": "eva_briefing2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 1,"description": "第一章：沙暴中的回响"}
            }
          ]
        }
      ]
    },
    {
      "id": "chapter1",
      "title": "第一章：沙暴中的回响",
      "scenes": [
        {
          "id": "scene1_1",
          "name": "任务简报",
          "background": "bg.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，欢迎上任。我们在撒哈拉沙漠边缘的哨站回声-7已经失联超过24小时。你的任务是带领突击步兵小队前往调查。",
              "voice": "eva_briefing1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "保持警惕，如果遇到敌对势力，授权你使用致命武力。查明情况，回收数据，然后撤离。",
              "voice": "eva_briefing2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
            }
          ]
        },
        {
          "id": "scene1_2",
          "name": "突袭与撤离",
          "background": "沙漠哨站.png",
          "bgm": "battle_bgm.mp3",
          "dialogs": [
            {
              "character": "",
              "text": "(远处的第二突击步兵分队传来枪声)",
              "voice": "gun.mp3"
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "是埋伏！击退他们，指挥官！撤离点已重新规划至东南侧直升机着陆区，坚持住！",
              "voice": "eva_battle_alert.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第一章任务",
                "mapId": "map_chapter1", // 修改为第一章地图ID
                "availableUnits": ["assault_infantry", "sniper", "main_battle_tank"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "annihilation"
              }
            }
          ]
        },
        {
          "id": "scene1_3",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "指挥官，干得漂亮。我们从哨站数据中找到加密标记......刻耳柏洛斯？我从没听说过这个组织。",
              "voice": "tanaka_data.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "刻耳柏洛斯......我曾在黑市武器流水号上见过这个标志。提高警戒！下一步，我们去安第斯峡谷。",
              "voice": "eva_next.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 2,"description": "进入第二章：峡谷中的秘密"}
            }
          ]
        }
      ]
    },
    {
      "id": "chapter2",
      "title": "第二章：峡谷中的秘密",
      "scenes": [
        {
          "id": "scene2_1",
          "name": "任务简报",
          "background": "峡谷.jpg",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，健司已经确认峡谷中隐藏着一个刻耳柏洛斯训练和后勤基地。我们必须拔掉这颗钉子。",
              "voice": "eva_canyon1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你将获得突击步兵、狙击手、反坦克兵和轻型坦克的支援。摧毁军火库、兵营和指挥中心！",
              "voice": "eva_canyon2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"} 
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第二章任务",
                "mapId": "map_chapter2", // 修改为第二章地图ID
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "light_tank"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "objective", // 目标模式：摧毁特定建筑
                "objectives": ["destroy_building:barracks", "destroy_building:armory", "destroy_building:command_center"]
              }
            }
          ]
        },
        {
          "id": "scene2_2",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "指挥官，我接收到了数据流......这是一份运输日志！他们从阿尔法研究所抢走了同位素核心！",
              "voice": "tanaka_core.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "阿尔法研究所？那是最高机密能源项目！立刻联系他们！指挥官，我们必须阻止运输！",
              "voice": "eva_core.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"},
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 3,"description": "进入第三章：霓虹下的战争"}
            }
          ]
        }
      ]
    },
    {
      "id": "chapter3",
      "title": "第三章：霓虹下的战争",
      "scenes": [
        {
          "id": "scene3_1",
          "name": "任务简报",
          "background": "新京都.jpg",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们必须在新京都市区找到并消灭毒蛇的指挥总部。他掌握同位素核心情报。",
              "voice": "eva_city1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你将获得全面支援，包括主战坦克、战机和榴弹炮。但小心城市防空！",
              "voice": "eva_city2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第三章任务",
                "mapId": "map_chapter3", // 修改为第三章地图ID
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "fighter_jet", "howitzer"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "assassination", // 刺杀模式：消灭特定单位
                "targetUnit": "assault_infantry"
              }
            }
          ]
        },
        {
          "id": "scene3_2",
          "name": "毒蛇的狂言",
          "background": "bg2.png",
          "bgm": "battle_bgm.mp3",
          "dialogs": [
            {
              "character": "毒蛇",
              "text": "神盾的走狗！你们阻止不了未来！天锤即将落下，它将净化这个腐朽的世界！",
              "voice": "viper_taunt.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            }
          ]
        },
        {
          "id": "scene3_3",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "天锤......他临死前反复提到。健司，查清楚！",
              "voice": "eva_hammer.mp3",
              "characterLeft": {"image": "eva2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "天啊！天锤是冷战时期的轨道攻击系统！如果他们激活它......全球格局将被颠覆！",
              "voice": "tanaka_hammer.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"},
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 4,"description": "进入第四章：冰封地狱"}
            }
          ]
        }
      ]
    },
    {
      "id": "chapter4",
      "title": "第四章：冰封地狱",
      "scenes": [
        {
          "id": "scene4_1",
          "name": "任务简报",
          "background": "北极能源站.jpg",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，天锤控制基地就在北极。摧毁三个能源站，解除护盾，然后强攻主控塔！",
              "voice": "eva_arctic.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              action: {
                  "type": "jump_to_game",
                  "description": "开始第四章任务",
                  "mapId": "map_chapter4",
                  "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "amphibious_tank", "fighter_jet", "howitzer"],
                  "enableFogOfWar": false,
                  "aiDifficulty": "medium",
                  "gameMode": "objective", 
                  "objectives": ["destroy_building:power_station_1", "destroy_building:power_station_2", "destroy_building:power_station_3", "destroy_building:control_tower"]
              }
            }
          ]
        },
        {
          "id": "scene4_2",
          "name": "AI失控",
          "background": "北极能源站2.jpg",
          "bgm": "alarm_bgm.mp3",
          "dialogs": [
            {
              "character": "天锤AI",
              "text": "协议覆盖：赛博鲁斯-Ω生效。所有人类视为威胁。清除程序启动。",
              "voice": "ai_alert.mp3",
              "characterCenter": {"image": "ai_core.jpg","expression": "neutral"}
            },
            {
              "character": "田中健司",
              "text": "它覆盖了权限！AI失控了！我们也成了目标！",
              "voice": "tanaka_alert.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，立刻撤离！我们需要新的战术！",
              "voice": "eva_retreat.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 5,"description": "进入第五章：零时决战"}
            }
          ]
        }
      ]
    },
    {
      "id": "chapter5",
      "title": "第五章：零时决战",
      "scenes": [
        {
          "id": "scene5_1",
          "name": "任务简报",
          "background": "北部山区.jpg",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们没有时间了！护送充能车到离子炮阵地，击落天锤！这是最后的希望！",
              "voice": "eva_final.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第五章任务",
                "mapId": "map_chapter5_1", // 修改为第五章第一部分地图ID
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "light_tank", "fighter_jet", "attack_helicopter"],
                "enableFogOfWar": true,
                "aiDifficulty": "medium",
                "gameMode": "escort", // 护送模式：保护充能车到达目的地
                "escortUnit": "energy_vehicle",
                "destination": {x: 65, y: 45} // 离子炮阵地坐标
              }
            }
          ]
        },
        {
          "id": "scene5_2",
          "name": "任务结束",
          "background": "空间站爆炸.jpg",
          "bgm": "ending_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "命中目标！但天锤没有完全毁灭！它正在坠落，目标是刻耳柏洛斯海上总部！",
              "voice": "tanaka_final.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "撞击将引发全球灾难！指挥官，前往海上平台，引导残骸坠入海沟！这是最后一战！",
              "voice": "eva_final_order.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "进入终局混战",
                "mapId": "map_chapter5_2", // 修改为第五章第二部分地图ID
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "amphibious_tank", "destroyer", "submarine", "fighter_jet"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "objective", // 目标模式：引导残骸坠入海沟
                "objectives": ["guide_debris:sea_trench"]
              }
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们成功了！天锤的残骸已安全坠入海沟，全球危机解除了。",
              "voice": "eva_victory1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "smile"}
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 6,"description": "进入终章：和平的黎明"}
            }
          ]
        }
      ]
    },
    {//胜利章节
      "id": "chapter_victory",
      "title": "终章：和平的黎明",
      "scenes": [
        {
          "id": "victory_scene",
          "name": "胜利的曙光",
          "background": "sunrise.jpg",
          "bgm": "victory_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "刻耳柏洛斯组织已经土崩瓦解，他们的首领在混乱中被捕。世界终于安全了。",
              "voice": "tanaka_victory1.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，没有你的领导和勇气，我们不可能取得这样的胜利。你是一位真正的英雄！",
              "voice": "eva_victory2.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "田中健司",
              "text": "是的，指挥官。你的名字将被载入史册，成为拯救世界的传奇。",
              "voice": "tanaka_victory2.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "虽然战斗结束了，但重建工作才刚刚开始。我们需要你的领导，指挥官。",
              "voice": "eva_victory3.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "action": {
                "type": "show_ending",
                "ending": "success"
              }
            }
          ]
        }
      ]
    },
    // 失败章节
    {
      "id": "chapter_fail",
      "title": "任务失败",
      "scenes": [
        {
          "id": "fail_scene",
          "name": "任务失败",
          "background": "command_center_fail.jpg",
          "bgm": "fail_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们失败了...部队损失惨重，必须重新评估战略。",
              "voice": "eva_fail1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "田中健司",
              "text": "刻耳柏洛斯的防御比我们预想的要强大。我需要时间分析数据，找出他们的弱点。",
              "voice": "tanaka_fail1.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "worried"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "撤退并重新集结，指挥官。这不是结束，我们会回来的。",
              "voice": "eva_fail2.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "action": {
                "type": "show_ending",
                "ending": "fail"
              }
            }
          ]
        }
      ]
    }
  ]
};
// 成就数据
const ACHIEVEMENTS = {
    '初战告捷': {
        name: '初战告捷',
        type: '剧情',
        description: '欢迎来到战场，指挥官。你成功应对了第一次考验。',
        points: 10,
        condition: '完成第一章"回声-7哨站"任务',
        icon: '🎯',
        unlocked: false,
        unlockTime: null
    },
    '深渊猎手': {
        name: '深渊猎手',
        type: '剧情', 
        description: '你摧毁了"刻耳柏洛斯"在安第斯山脉的巢穴',
        points: 15,
        condition: '完成第二章"安第斯突袭"任务',
        icon: '🏔️',
        unlocked: false,
        unlockTime: null
    },
    '都市幽灵': {
        name: '都市幽灵',
        type: '剧情',
        description: '在霓虹都市的混乱中，你清除了目标"毒蛇"',
        points: 20,
        condition: '完成第三章"新京斩首"任务',
        icon: '🌃',
        unlocked: false,
        unlockTime: null
    },
    '极地风暴': {
        name: '极地风暴',
        type: '剧情',
        description: '顶着北极的暴风雪，你成功瓦解了天锤的防御',
        points: 25,
        condition: '完成第四章"北极总攻"任务',
        icon: '❄️',
        unlocked: false,
        unlockTime: null
    },
    '终局之光': {
        name: '终局之光',
        type: '剧情',
        description: '你拯救了世界。人类文明将铭记这一天',
        points: 50,
        condition: '完成最终章"海上终战"任务',
        icon: '🌟',
        unlocked: false,
        unlockTime: null
    },
    '爱兵如子': {
        name: '爱兵如子',
        type: '战术',
        description: '完美的战术执行！你的名字将被载入史册',
        points: 30,
        condition: '单场战斗中，无任何单位损失',
        icon: '❤️',
        unlocked: false,
        unlockTime: null
    },
    '闪电突击': {
        name: '闪电突击',
        type: '战术',
        description: '兵贵神速，你的进攻让敌人措手不及',
        points: 20,
        condition: '于1分钟内完成任一关卡',
        icon: '⚡',
        unlocked: false,
        unlockTime: null
    },
    '全能指挥官': {
        name: '全能指挥官',
        type: '战术',
        description: '你精通所有兵种的协同艺术，是一位真正的全能指挥官',
        points: 25,
        condition: '单场战斗中，建造并部署所有类型的作战单位（步兵、坦克、空军、海军）',
        icon: '🎖️',
        unlocked: false,
        unlockTime: null
    },
    '反装甲专家': {
        name: '反装甲专家',
        type: '战术',
        description: '敌人的钢铁洪流在你面前不堪一击',
        points: 15,
        condition: '单场战斗中，累计摧毁3辆敌方重型坦克',
        icon: '💥',
        unlocked: false,
        unlockTime: null
    },
    // '全球防御者': {
    //     name: '全球防御者',
    //     type: '挑战',
    //     description: '你是神盾部队有史以来最优秀的指挥官',
    //     points: 100,
    //     condition: '以"困难"难度完成整个战役',
    //     icon: '🌎',
    //     unlocked: false,
    //     unlockTime: null
    // },
    '正义天降': {
        name: '正义天降',
        type: '隐藏',
        description: '你的空降兵不仅是侦察兵，更是死神',
        points: 20,
        condition: '单场战斗中，使用步兵单位直接摧毁5辆敌方载具',
        icon: '🪂',
        unlocked: false,
        unlockTime: null
    },
    '海陆协同': {
        name: '海陆协同',
        type: '隐藏',
        description: '你证明了神盾部队拥有无缝的多维作战能力',
        points: 20,
        condition: '单场战斗中，用海军舰艇击毁一个陆地目标，同时用陆军单位击毁一艘海军舰艇',
        icon: '⚓',
        unlocked: false,
        unlockTime: null
    },
    '人海战术': {
        name: '人海战术',
        type: '隐藏',
        description: '你的军队浩浩荡荡，足以碾碎一切敌人',
        points: 30,
        condition: '单场战斗中，同时拥有50个以上单位存活',
        icon: '👥',
        unlocked: false,
        unlockTime: null
    },
    '神话守护者': {
        name: '神话守护者',
        type: '隐藏',
        description: '你已达成全部目标。你就是守护人类的神盾',
        points: 100,
        condition: '解锁所有其他成就',
        icon: '🛡️',
        unlocked: false,
        unlockTime: null
    }
};