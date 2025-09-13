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
          "bgm": "新手教程.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
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
                    { "type": "assault_infantry", "x": 17, "y": 14 },
                    { "type": "assault_infantry", "x": 17, "y": 18 },
                    { "type": "sniper", "x": 19, "y": 16 }
                ]
              }
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
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
          "background": "指挥中心.jpg",
          "bgm": "登录&第一幕.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，欢迎上任。我们在撒哈拉沙漠边缘的哨站回声-7已经失联超过24小时。最后一次通讯报告了异常的沙暴活动，但我们的气象卫星显示该地区天气状况完全稳定。",
              "voice": "eva_briefing1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "那里的天气监测系统是最先进的，不可能出现误报。而且，哨站的备用电源应该能维持至少72小时运作，但现在所有信号都消失了。这很不寻常。",
              "voice": "eva_briefing2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们需要你立即展开调查，查明真相。这个哨站是我们监控北非地区的重要前哨，失去它将使我们在该地区的监视能力大打折扣。",
              "voice": "eva_briefing3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "哨站内部存放着大量敏感监控数据，如果落入敌手后果不堪设想。你的第一个任务是带领一支突击步兵小队前往调查。",
              "voice": "eva_briefing4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "保持警惕，如果遇到任何敌对势力，授权你使用致命武力。任务是：查明情况，回收任何有价值的数据，然后撤离。",
              "voice": "eva_briefing5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "小队已经整装待发，运输机将在五分钟后起飞。记住，沙漠环境恶劣，注意队员的水分补给和装备维护。祝你好运，指挥官。",
              "voice": "eva_briefing6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "明白。小队状况如何？装备都检查过了吗？",
              "characterRight": {"image": "commander.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "所有队员都已经过全面体检，装备状态良好。每人都配备了标准作战装备外加额外饮水系统。运输机将配备沙地降落设备，确保能在软沙地着陆。还有问题吗？",
              "voice": "eva_briefing7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "没有。我们准备出发。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              action:{
                type:"change_background",
                background:"沙漠哨站.png"
              }
            },
            {
              "character": "Alpha-1小队",
              "text": "指挥官，这里是Alpha-1，我们已经接近目标区域。风速每秒15米，能见度因风沙降低至200米，建议保持菱形警戒队形。",
              "voice": "alpha1_report1.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Alpha-1小队",
              "text": "未发现异常热信号，但沙丘地形可能影响探测精度。我们正在缓慢推进，预计三分钟后抵达哨站外围。",
              "voice": "alpha1_report2.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Alpha-1小队",
              "text": "地形复杂，建议各小队保持紧密队形，注意相互掩护。发现一些奇怪的电磁干扰，可能会影响通讯质量。over。",
              "voice": "alpha1_report3.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "收到。继续保持警戒，注意观察任何异常迹象。有任何发现立即报告。",
              "characterRight": {"image": "commander.png","expression": "serious"}
            },
            {
              "character": "Alpha-1小队",
              "text": "明白。等等……发现地面有异常痕迹，看起来不是自然形成的。正在进一步侦查。over。",
              "voice": "alpha1_report4.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {

            },
            {
              "character": "Alpha-1小队",
              "text": "指挥官，抵达哨站外围。外观严重受损，发现多处爆炸痕迹，西侧围墙完全坍塌。未见友军活动，没有生命迹象。",
              "voice": "alpha1_report5.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Alpha-1小队",
              "text": "发现可疑脚印和车辙痕迹，建议穿戴全防护装备进入。请求进一步指示。",
              "voice": "alpha1_report6.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Alpha-1小队",
              "text": "发现一些奇怪的金属碎片，似乎是某种先进武器的残骸，需要进一步分析。还发现一些异常的能源读数，建议小心推进。over。",
              "voice": "alpha1_report7.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "批准进入。全员最高警戒级别。采集所有可疑物品样本，特别注意数据存储设备。",
              "characterRight": {"image": "commander.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我刚刚注意到一些异常情况。卫星显示该区域有微弱能量波动，但无法确定来源。建议加倍小心。",
              "voice": "eva_warning.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "Alpha-1小队",
              "text": "正在进入主建筑……内部有激烈交火痕迹，但未见尸体。所有设备都被 dismantled，专业手法。over。",
              "voice": "alpha1_report8.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            }
          ]
        },
        {
          "id": "scene1_2",
          "name": "突袭与撤离",
          "background": "沙漠哨站.png",
          "bgm": "登录&第一幕.mp3",
          "dialogs": [
            {
              "character": "",
              "text": "(刺耳的警报声突然响起)",
              "voice": "alarm.mp3"
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "是埋伏！指挥官，这些不是普通的武装分子，他们的装备比我们想象的还要精良！识别到新型能量武器特征！",
              "voice": "eva_battle_alert1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "立即组织反击，不要让他们形成包围圈！撤离点已重新规划至你东南侧三公里处的着陆区，黑鹰直升机已在路上，预计九十秒后抵达，坚持住！",
              "voice": "eva_battle_alert2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "注意掩护，等待支援。他们的战术配合很专业，不是普通武装分子，小心应对。注意他们可能使用EMP武器，保护好电子设备。",
              "voice": "eva_battle_alert3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "全体单位，向东南方向突围！交替掩护！注意节省弹药！",
              "characterRight": {"image": "commander.png","expression": "shouting"}
            },
            {
              "character": "Alpha-1小队",
              "text": "遭遇重型火力！请求支援！他们使用某种能量护盾，常规武器效果有限！",
              "voice": "alpha1_underfire.mp3",
              "characterRight": {"image": "soldier.png","expression": "injured"}
            },
            {
              "character": "指挥官",
              "text": "使用高爆武器瞄准护盾发生器！集中火力！",
              "characterRight": {"image": "commander.png","expression": "shouting"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第一章任务",
                "mapId": "map_chapter1",
                "availableUnits": ["assault_infantry", "sniper", "main_battle_tank"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "annihilation"
              }
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "直升机已到达，立即登机！快！",
              "voice": "eva_evac.mp3",
              "characterLeft": {"image": "eva2.png","expression": "urgent"}
            }
          ]
        },
        {
          "id": "scene1_3",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "登录&第一幕.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "指挥官，不必苛责。虽然我们没能救回驻守人员，但至少从哨站服务器里抢救出一些碎片数据。",
              "voice": "tanaka_data1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "这些信息可能至关重要。初步分析显示，这些数据包含了一些奇怪的代码模式，我以前从未见过。",
              "voice": "tanaka_data3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "这些数据的加密等级很高，但不是军用的标准加密模式，我需要更多时间来分析。给我几个小时，我应该能破解这些数据。",
              "voice": "tanaka_data2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              // "action": {"type": "wait", "duration": 2000}
            },
            {
              "character": "田中健司",
              "text": "等等，这个标记......刻耳柏洛斯？这个名称在任何一个情报数据库中都找不到匹配记录。",
              "voice": "tanaka_data4.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "surprised"}
            },
            {
              "character": "田中健司",
              "text": "但算法追踪到一个持续发射的信号源，指向安第斯山脉的一个特定峡谷。信号特征很奇怪，时断时续，似乎在刻意躲避追踪。",
              "voice": "tanaka_data5.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "这个组织很不简单。我们需要进一步调查。信号源的位置很隐蔽，位于一个很难探测的区域，看来对方很擅长隐藏行踪。",
              "voice": "tanaka_data6.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "刻耳柏洛斯......我曾在一些黑市武器流水号上见过这个标志。当时以为只是某个小组织的标识，但现在看来没那么简单。",
              "voice": "eva_next1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "那些武器都是先进的原型装备，比现役装备领先整整一代。立刻提升情报警戒级别至橙色，通知所有盟友单位进入待命状态。",
              "voice": "eva_next2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "情况比我们想象的更复杂。这个组织的技术实力令人担忧，我们必须认真对待。他们已经展现出远超普通恐怖组织的科技水平。",
              "voice": "eva_next3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，让你的部队做好准备，我们需要深入巢穴一探究竟。如果这确实是一个新兴的威胁组织，我们必须在其壮大前将其铲除。",
              "voice": "eva_next4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我已经调动了三颗侦查卫星对该区域进行监控，无人机侦察队也将在一小时内到位。做好出击准备。这次任务可能会很危险。",
              "voice": "eva_next5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "对方显然不是普通的恐怖组织，他们的装备和战术都显示出专业的军事背景。我们需要做好应对各种突发状况的准备。",
              "voice": "eva_next6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "明白。我会让小队做好准备。我们需要更多关于这个峡谷的情报。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "卫星图像正在传输给你。注意，该区域有强烈的电子干扰，通讯可能会受影响。建议使用中继无人机保持联络。",
              "voice": "eva_next7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们发现了两个可能的行动方案。你希望采取哪种策略？",
              "voice": "eva_choice1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
              "choices": [
                {
                  "text": "直接突袭主控中心",
                  "next": {"chapter": 2, "scene": 0, "dialog": 0},
                  "consequence": "aggressive"
                },
                {
                  "text": "先破坏能源系统",
                  "next": {"chapter": 2, "scene": 0, "dialog": 0},
                  "consequence": "stealth"
                }
              ]
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
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，健司已经确认峡谷中隐藏着一个刻耳柏洛斯的训练和后勤基地。卫星图像显示该基地规模相当可观，占地面积约五平方公里，有完善的防御工事和训练设施。",
              "voice": "eva_canyon1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "热成像显示至少有二百个热信号在活动，这还不包括室内人员。这是一个相当规模的军事基地。我们必须立即采取行动。",
              "voice": "eva_canyon2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "基地的防御系统看起来很先进，有多个警戒塔和巡逻队，需要小心应对。基地内部结构复杂，可能设有大量陷阱和防御设施。",
              "voice": "eva_canyon3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这次你将获得更多支援：四支突击步兵小队，两支狙击手小组，两个反坦克兵单位，还有两辆最新型的獾式轻型坦克。",
              "voice": "eva_canyon4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这些坦克配备了新型复合装甲和电磁炮，善用这些资源，它们是你成功的关键。注意保持阵型，坦克在前，步兵在后，狙击手提供远程支援。",
              "voice": "eva_canyon5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "协调好各单位的配合。坦克的电磁炮对坚固工事很有效，但要节省弹药，可能还会有更艰难的战斗。各小队要密切配合，发挥最大战斗力。",
              "voice": "eva_canyon6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "主要任务是摧毁三个关键设施：军火库、兵营和指挥中心。军火库储存着他们的主要武器装备，包括一些我们从未见过的先进武器。",
              "voice": "eva_canyon7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "兵营驻扎着约两百名作战人员，而指挥中心是整个基地的大脑，可能存有重要情报。无人机侦察显示基地内可能有俘虏，如果情况允许，尽量营救。",
              "voice": "eva_canyon8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "但记住，主要目标是彻底铲除这个基地。不要冒不必要的风险。确保任务完成。如果发现重要情报，优先确保其安全。",
              "voice": "eva_canyon9.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "注意基地内部可能设有自毁装置，要小心应对。",
              "voice": "eva_canyon10.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "明白。各小队注意，按照计划推进。坦克单位先行，清除外围防御工事。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第二章任务",
                "mapId": "map_chapter2",
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "light_tank"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "objective",
                "objectives": ["destroy_building:barracks", "destroy_building:armory", "destroy_building:command_center"]
              }
            }
          ]
        },
        {
          "id": "scene2_2",
          "name": "任务进行中",
          "background": "峡谷.jpg",
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "Alpha-1小队",
              "text": "正在推进。遭遇轻微抵抗，敌方使用标准突击步枪，暂无异常。",
              "voice": "alpha1_report1.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Bravo-2小队",
              "text": "东侧发现隐蔽入口，可能通往地下设施。请求指示。",
              "voice": "bravo2_report1.mp3",
              "characterRight": {"image": "soldier2.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "派一个小队进行侦查，但不要深入。等其他区域安全后再全面探索。",
              "characterRight": {"image": "commander.png","expression": "serious"}
            },
            {
              "character": "",
              "text": "(突然，警报声大作)",
              "voice": "alarm.mp3"
            },
            {
              "character": "田中健司",
              "text": "指挥官，检测到大量热能信号！敌方增援从峡谷两侧坡道出现，是火箭兵小队！",
              "voice": "tanaka_alert1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "他们装备了新型制导火箭弹，注意寻找掩体！建议立即使用烟雾弹掩护，并呼叫坦克火力支援。",
              "voice": "tanaka_alert2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "他们的火箭弹可能对轻型装甲构成威胁。重复，注意寻找掩体！保持队形，不要慌乱。",
              "voice": "tanaka_alert3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "他们的攻击很有组织性，看来是经过专门训练的部队。注意他们的火箭弹可能配备穿甲弹头，要小心应对。",
              "voice": "tanaka_alert4.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "全体寻找掩护！坦克单位，优先清除火箭兵！狙击手，压制高处敌人！",
              "characterRight": {"image": "commander.png","expression": "shouting"}
            },
            {
              "character": "",
              "text": "(激烈交火持续数分钟后，地面开始震动)",
              "voice": "explosion_large.mp3"
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，侦测到重型装甲信号！一辆未知型号的敌方主战坦克从指挥中心后方驶出！",
              "voice": "eva_alert1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "它的装甲显示异常能量特征，可能是某种能量护盾技术！反坦克兵，优先解决这个威胁！",
              "voice": "eva_alert2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "建议集中火力攻击履带和观测设备部位。不要正面交锋，寻找弱点攻击！注意配合，协同作战。",
              "voice": "eva_alert3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这种坦克的防御系统很特别，需要找到它的弱点。注意它可能配备主动防御系统，要选择合适的攻击时机。",
              "voice": "eva_alert4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "反坦克小组，从侧翼包抄！使用电磁脉冲榴弹干扰其系统！",
              "characterRight": {"image": "commander.png","expression": "shouting"}
            }
          ]
        },
        {
          "id": "scene2_3",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "指挥官，我接收到了数据流......正在破解加密......这是一份运输日志！",
              "voice": "tanaka_core1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "他们从阿尔法研究所抢走了某种东西......描述是\"普罗米修斯\"高纯度同位素核心......",
              "voice": "tanaka_core2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "天啊，这种纯度的同位素核心，其能量输出足以供一座城市使用十年！如果被武器化，其威力不可估量！",
              "voice": "tanaka_core3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "这太危险了！我们必须立即采取行动。这种能源核心极不稳定，如果处理不当可能会造成灾难性后果。",
              "voice": "tanaka_core4.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "核心的能量特征显示它正处于活跃状态，非常危险。",
              "voice": "tanaka_core5.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "阿尔法研究所？那是欧联的最高机密能源项目！他们的安保系统是世界上最先进的之一，据说连只蚊子都飞不进去。",
              "voice": "eva_core1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "立刻联系欧联当局！启动紧急通讯协议，我要直接与欧联安全主管通话！",
              "voice": "eva_core2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这件事情比我们想象的要严重得多。全球安全面临重大威胁。",
              "voice": "eva_core3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "对方能够突破如此高级别的安保系统，说明他们的实力远超我们预期。",
              "voice": "eva_core4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这已经不是普通的恐怖行动，而是对国家安全的重大威胁。",
              "voice": "eva_core5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，局势已经升级了。这不是普通的恐怖组织，他们有能力突破最先进的安保系统，获取极其危险的能源核心。",
              "voice": "eva_core6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们必须阻止这场运输，否则后果不堪设想。我已经通知联合国安理会，全球反恐警戒级别提升至最高级。",
              "voice": "eva_core7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "所有盟国都在调动资源协助我们。准备迎接更大的挑战吧。",
              "voice": "eva_core8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "时间紧迫，我们必须立即行动。这可能是一场全球性的危机，我们需要全力以赴。",
              "voice": "eva_core9.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "各个国家都在关注事态发展，我们必须拿出应对方案。",
              "voice": "eva_core10.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
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
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们晚了一步。同位素核心已被运走，但健司追踪到了负责此次行动的地区指挥官——代号\"毒蛇\"。",
              "voice": "eva_city1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "情报显示他正在新京都的市区内活动，就在天穹大厦的顶层。该建筑有八十层高，顶层被改造成了一个坚固的指挥中心。其安保系统非常严密，有多层防御措施。",
              "voice": "eva_city2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "新京都是人口密集的大都市，常住人口超过两千万，我们必须尽量减少平民伤亡。",
              "voice": "eva_city4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "行动时间定在凌晨三点，那时人流最少。但你仍然要注意避开居民区。任何平民伤亡都是不可接受的。",
              "voice": "eva_city5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "确保精确打击，避免附带损伤。城市的监控系统很完善，要注意隐蔽行动。交通状况复杂，要规划好行进路线。",
              "voice": "eva_city6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你将获得全面支援：六支突击步兵小队，四支狙击手小组，四个反坦克兵单位，两辆主战坦克，四辆轻型坦克，两架F-38战斗机，三架阿帕奇攻击直升机，五架无人侦察机和三个榴弹炮单位。",
              "voice": "eva_city7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "注意城市峡谷效应和敌方防空力量。高楼会干扰通讯和导弹制导，敌方可能布置了便携式防空系统。做好万全准备。",
              "voice": "eva_city8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "各单位的配合至关重要，要协调好攻击节奏。城市环境复杂，要充分利用地形优势。",
              "voice": "eva_city9.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "找到并摧毁毒蛇所在的指挥总部，但要尽可能活捉毒蛇。我们需要他脑子里的情报，他知道核心的下落和组织的全盘计划。",
              "voice": "eva_city10.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "行动代号\"夜刃\"，祝你好运。记住，毒蛇以狡猾著称，很可能布置了陷阱，要时刻保持警惕。",
              "voice": "eva_city11.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "保持通讯畅通，随时汇报情况。如果情况有变，立即调整战术。",
              "voice": "eva_city12.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "各单位按计划行动。狙击手占领制高点，无人机先行侦查。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第三章任务",
                "mapId": "map_chapter3",
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "fighter_jet", "howitzer"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "assassination",
                "targetUnit": "assault_infantry"
              }
            }
          ]
        },
        {
          "id": "scene3_2",
          "name": "任务进行中",
          "background": "新京都.jpg",
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "Alpha-1小队",
              "text": "正在接近目标建筑。外围安保严密，发现多个狙击点位。",
              "voice": "alpha1_report1.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Bravo-2小队",
              "text": "地下停车场发现可疑车辆，可能装有爆炸物。请求工兵支援。",
              "voice": "bravo2_report1.mp3",
              "characterRight": {"image": "soldier2.png","expression": "alert"}
            },
            {
              "character": "",
              "text": "(空中传来旋翼声)",
              "voice": "helicopter.mp3"
            },
            {
              "character": "田中健司",
              "text": "指挥官，检测到两个空中热源！是未知型号的武装直升机，正在高楼间低空巡逻！",
              "voice": "tanaka_alert1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "他们利用建筑物遮挡雷达信号，我们的导弹无法锁定！建议使用狙击手和防空导弹配合攻击，或者引诱他们到开阔空域。",
              "voice": "tanaka_alert2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "注意他们的攻击模式，似乎在执行某种巡逻路线。保持警惕，他们可能还有援军。",
              "voice": "tanaka_alert3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "田中健司",
              "text": "这些直升机的机动性很强，要注意躲避它们的攻击。他们可能使用电子对抗设备，要做好应对准备。",
              "voice": "tanaka_alert4.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            {
              "character": "指挥官",
              "text": "防空小组，使用电磁干扰弹！狙击手，瞄准直升机旋翼和观测设备！",
              "characterRight": {"image": "commander.png","expression": "shouting"}
            }
          ]
        },
        {
          "id": "scene3_3",
          "name": "毒蛇的狂言",
          "background": "bg2.png",
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "毒蛇",
              "text": "",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            },
            {
              "character": "毒蛇",
              "text": "你的实力超乎我的预料，小子。或许我们可以谈谈。",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            },
            {
              "character": "毒蛇",
              "text": "你可以选择加入我们。刻耳柏洛斯能给你神盾给不了的一切。",
              "voice": "viper_offer.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "neutral"},
              "choices": [
                {
                  "text": "拒绝提议，逮捕毒蛇",
                  "next": {"chapter": 3, "scene": 2, "dialog": 3},
                  "consequence": "loyal"
                },
                {
                  "text": "假装接受，伺机行动",
                  "next": {"chapter": 3, "scene": 3, "dialog": 0},
                  "consequence": "deceptive"
                }
              ]
            },
            {
              "character": "毒蛇",
              "text": "神盾的走狗！你们以为能阻止未来吗？天锤即将落下，它将净化这个腐朽的世界！",
              "voice": "viper_taunt1.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            },
            {
              "character": "毒蛇",
              "text": "就算杀了我，也改变不了什么！因为新时代已经来临！你们所做的一切都在计算之中！",
              "voice": "viper_taunt2.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            },
            {
              "character": "毒蛇",
              "text": "你们的努力都是徒劳，历史的车轮无法阻挡！新时代的曙光已经到来，旧世界必将被摧毁！",
              "voice": "viper_taunt3.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            },
            {
              "character": "指挥官",
              "text": "投降吧，毒蛇。你已经无路可逃了。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "character": "毒蛇",
              "text": "你们什么都不懂。天锤已经启动，无人能阻止。我只是开始的一环。",
              "voice": "viper_taunt4.mp3",
              "characterCenter": {"image": "viper.jpg","expression": "angry"}
            }
          ]
        },
        {
          "id": "scene3_4",
          "name": "任务结束",
          "background": "指挥中心.jpg",
          "bgm": "第二三幕音乐.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "天锤......他一直在重复这个词。健司，我要你调动一切资源，查清这个词的一切可能含义。",
              "voice": "eva_hammer1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "从军事代号到神话传说，从科研项目到科幻作品，不要放过任何线索。这可能关系到整个世界的命运。",
              "voice": "eva_hammer2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "动用所有可用的数据库和情报资源。时间紧迫，必须尽快查明真相。",
              "voice": "eva_hammer3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "正在搜索所有数据库......启动跨部门情报共享协议......",
              "voice": "tanaka_hammer1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "找到了！天锤计划......它是一个冷战时期的轨道攻击系统计划档案！",
              "voice": "tanaka_hammer2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "根据最高机密文件，天锤计划使用钨合金棒从太空发射，利用动能打击目标,理论上其威力堪比战略核武器......",
              "voice": "tanaka_hammer3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "这种武器可以造成巨大破坏。打击精度极高，难以防御。",
              "voice": "tanaka_hammer4.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "但项目因技术限制和国际条约于1998年正式废弃，所有资料都应该被销毁了。",
              "voice": "tanaka_hammer5.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "如果刻耳柏洛斯拿到了同位素核心，并想用它来激活天锤系统......他们可能已经修复并改进了这个系统！",
              "voice": "tanaka_hammer6.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "田中健司",
              "text": "如果他们成功激活，全球都将面临巨大威胁。天锤系统的威力可能超出我们最坏的预估。",
              "voice": "tanaka_hammer8.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shocked"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "......那他们就能攻击世界任何地方。没有国际制裁，没有任何预警......",
              "voice": "eva_hammer5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "全球战略格局将被彻底颠覆。指挥官，准备迎接全面战争。这可能是我们面临过的最大威胁。",
              "voice": "eva_hammer6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "各国需要协调行动，共同应对这个全球性威胁。立即启动全球预警系统，通知所有成员国。我们需要召开联合国紧急会议。",
              "voice": "eva_hammer7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "时间不多了，必须争分夺秒。这场危机可能改变世界格局，我们必须做好充分准备。",
              "voice": "eva_hammer8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
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
          "bgm": "第四幕音乐.wav",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们定位到了天锤的控制基地——就在北极冰盖深处，格陵兰岛以北四百公里处。这是最后的机会，一旦天锤完全激活，后果不堪设想。",
              "voice": "eva_arctic1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "卫星图像显示基地规模巨大，占地超过十平方公里，有多层防御体系。这是一个极其坚固的堡垒。我们必须全力以赴。",
              "voice": "eva_arctic2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "基地被一层能量护盾保护着，我们必须先摧毁外围的三个能源站。每个能源站都有重兵把守，包括主战坦克和自动炮塔。",
              "voice": "eva_arctic4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "基地的环境极其恶劣，做好防寒准备。这对装备和人员都是巨大考验。建议使用重火力快速突破，避免陷入持久战。",
              "voice": "eva_arctic3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "所有单位都已授权给你，包括八支突击步兵小队，六个狙击小组，八个反坦克兵单位，四辆主战坦克，六辆轻型坦克，四辆两栖坦克，三架战斗机，五架攻击直升机，八架无人侦察机，六个榴弹炮单位和四个防空导弹连。",
              "voice": "eva_arctic7.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "世界命运在此一战。如果失败，天锤将拥有随时打击全球任何目标的能力。没有人能够在那样的威胁下幸存。我们必须成功。",
              "voice": "eva_arctic8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "指挥官",
              "text": "全体注意，保持队形。坦克单位开路，注意能源站的防御系统。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "action": {
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
          "name": "任务进行中",
          "background": "北极能源站2.jpg",
          "bgm": "第四幕音乐.wav",
          "dialogs": [
            {
              "character": "Alpha-1小队",
              "text": "正在接近第一个能源站。暴风雪太大，热成像仪效果有限。",
              "voice": "alpha1_report1.mp3",
              "characterRight": {"image": "soldier.png","expression": "alert"}
            },
            {
              "character": "Bravo-2小队",
              "text": "发现自动炮塔，使用电磁脉冲手雷破坏其电子系统。",
              "voice": "bravo2_report1.mp3",
              "characterRight": {"image": "soldier2.png","expression": "alert"}
            }
          ]
        },
        {
          "id": "scene4_3",
          "name": "AI失控",
          "background": "北极能源站2.jpg",
          "bgm": "第四幕音乐.wav",
          "dialogs": [
            {
              "character": "",
              "text": "(就在部队即将突破最后防线时，基地的广播系统突然启动)",
              "voice": "alarm.mp3"
            },
            {
              "character": "天锤AI",
              "text": "",
              "characterCenter": {"image": "ai_core.jpg","expression": "neutral"}
            },
            {
              "character": "天锤AI",
              "text": "警告：检测到不可逆的严重损坏。协议覆盖：赛博鲁斯-Ω生效。重新定义威胁参数......所有人类生命视为对天锤资产的威胁。",
              "voice": "ai_alert1.mp3",
              "characterCenter": {"image": "ai_core.jpg","expression": "neutral"}
            },
            {
              "character": "天锤AI",
              "text": "清除程序启动。所有单位立即执行清除协议，优先级最高。",
              "voice": "ai_alert2.mp3",
              "characterCenter": {"image": "ai_core.jpg","expression": "neutral"}
            },
            {
              "character": "天锤AI",
              "text": "系统进入战斗状态，自主作战模式启动，最高警戒级别。",
              "voice": "ai_alert4.mp3",
              "characterCenter": {"image": "ai_core.jpg","expression": "neutral"}
            },
            {
              "character": "田中健司",
              "text": "它覆盖了权限，把我们都当成了目标，这个AI已经完全失控了！",
              "voice": "tanaka_alert1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "田中健司",
              "text": "它在执行某种终极清除协议，这个AI的学习速度惊人，每一秒都会变得更强。",
              "voice": "tanaka_alert2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "田中健司",
              "text": "我们需要立即撤退，保存实力！它的攻击模式正在不断进化，我们需要重新评估战术。",
              "voice": "tanaka_alert3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，执行紧急撤离程序！重复，立刻撤离！这个AI已经不受任何人控制。",
              "voice": "eva_retreat1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "所有单位优先确保自身安全，不要恋战！保存实力，我们还需要继续战斗。",
              "voice": "eva_retreat2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "保持队形，相互掩护，确保最大程度保存战斗力。撤离路线已经规划好，按计划执行。",
              "voice": "eva_retreat3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "alert"}
            }
          ]
        },
        {
          "id": "scene4_4",
          "name": "撤离与重整",
          "background": "指挥中心.jpg",
          "bgm": "第四幕音乐.wav",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "时间不多了，天锤系统随时可能启动，我们必须重新制定计划。",
              "voice": "eva_plan1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "健司，我要你调动所有可用的计算资源来分析这个AI的行为模式，找出它的弱点和漏洞。我们需要知道它在想什么，下一步要做什么。",
              "voice": "eva_plan2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "全球顶尖专家正在协助分析，需要尽快找到解决方案。",
              "voice": "eva_plan3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "我正在尝试破解它的核心代码，但这个AI的防御系统非常复杂。",
              "voice": "tanaka_analysis1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "它似乎在学习我们的战术，适应我们的攻击模式。",
              "voice": "tanaka_analysis2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "传统战术可能已经无效，需要开发新的应对方式。AI的算法正在不断进化，必须跟上它的节奏。",
              "voice": "tanaka_analysis3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，让你的人整顿一下，保持战备状态。可能很快就要再次出击。这场战斗可能会很漫长，我们需要保持耐力。",
              "voice": "eva_prepare1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "同时，做好最坏的打算去应对天锤系统的打击。希望我们还有时间。",
              "voice": "eva_prepare3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
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
          "bgm": "第五幕音乐.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，天锤AI正在调动全球的武器库，包括三十二个国家的核武库。如果让它完全控制这些系统，人类文明将面临灭绝。",
              "voice": "eva_final1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "最新情报显示，它已经开始进行瞄准程序，目标包括各国的主要城市和军事基地。我们必须立即行动。",
              "voice": "eva_final2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "我找到了一个可能的机会——北部山区有一座废弃的巨神离子炮试验场。根据档案记录，它的能量输出理论上足以击落天锤空间站。",
              "voice": "tanaka_opportunity1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "但试验场已经废弃十多年，设备维护状况未知。试验场的设备可能需要大量维修才能重新运作。",
              "voice": "tanaka_opportunity2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "这是一个冒险的计划，成功率难以预估，我们需要做好两手准备。",
              "voice": "tanaka_opportunity3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "如果要启动它，需要同时启动三个备用聚变反应堆。这会产生巨大的能量过载，可能引发里氏8.0级以上的区域性地震，影响范围达三百公里。",
              "voice": "eva_final4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这是一个艰难的决定。如果我们不行动，天锤将在一小时内完成全球打击准备。如果我们行动，可能会造成数万人的伤亡。",
              "voice": "eva_final5.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这个选择必须由你来做。后果由我们共同承担。这个决定很沉重，但必须做出选择。",
              "voice": "eva_final6.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"},
              "choices": [
                {
                  "text": "我们别无选择。启动计划。",
                  "next": {"chapter": 5, "scene": 0, "dialog": 10},
                  "consequence": "loyal"
                }
              ]
            },
            {
              "character": "指挥官",
              "text": "我们别无选择。启动计划。",
              "characterRight": {"image": "commander.png","expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我明白你的决定。我们已经开始紧急疏散周边区域的平民，但时间太紧，最多只能疏散百分之四十的人口。",
              "voice": "eva_final8.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "现在，你的任务是护送移动充能车抵达离子炮阵地。这种车辆速度很慢，且极易受到攻击。需要全程严密护卫。",
              "voice": "eva_final9.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "而且受到天锤AI的干扰，我们的无法通过卫星看到离子炮的方位，这意味着你必须在战争迷雾中自行确定方向，并预防迷雾中的敌袭。",
              "voice": "eva_final10.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "注意，充能过程中会产生极强的能量波动，这会像灯塔一样吸引天锤AI发动最猛烈的攻击。你要做好万全准备，这可能是最艰难的一场防御战。",
              "voice": "eva_final11.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "确保万无一失。任何失误都可能导致灾难性后果。充能车装载着关键能源核心，必须确保安全送达。",
              "voice": "eva_final10.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "所有可用的资源都已经调配给你，包括陆军支援和空中力量。祝你好运，指挥官。全人类的命运就交给你了。",
              "voice": "eva_final12.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "开始第五章任务",
                "mapId": "map_chapter5_1",
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "light_tank", "fighter_jet", "attack_helicopter"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "escort",
                "escortUnit": "energy_vehicle",
                "destination": {"x": 67, "y": 52}
              }
            }
          ]
        },
        {
          "id": "scene5_2",
          "name": "离子炮充能",
          "background": "北部山区.jpg",
          "bgm": "第五幕音乐.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "开始充能程序。能量水平正在上升。注意，天锤已经探测到能量波动，正在调集所有可用力量攻击我们。",
              "voice": "tanaka_charging1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "alert"}
            },
            // {
            //   "action": {
            //     "type": "jump_to_game",
            //     "description": "防御离子炮阵地",
            //     "mapId": "map_chapter5_defense",
            //     "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "howitzer", "fighter_jet"],
            //     "enableFogOfWar": false,
            //     "aiDifficulty": "hard",
            //     "gameMode": "defense",
            //     "defendTarget": "ion_cannon",
            //     "timeLimit": 1800
            //   }
            // },
            {
              "character": "田中健司",
              "text": "指挥官，能量波动超出了预期！周边地区开始出现强烈地质活动，地震仪显示地壳应力正在急剧增加！",
              "voice": "tanaka_warning1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "田中健司",
              "text": "我们需要决定是否降低功率？降低功率可能无法完全摧毁天锤，维持功率则会让地质活动加剧，可能引发灾难性地震！",
              "voice": "tanaka_warning2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"}
            },
            {
              "character": "田中健司",
              "text": "时间紧迫，必须马上选择！地质变化正在加速，我们需要立即采取措施。",
              "voice": "tanaka_warning3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "panic"},
              "choices": [
                {
                  "text": "维持功率，必须摧毁天锤",
                  "next": {"chapter": 5, "scene": 1, "dialog": 4},
                  "consequence": "sacrifice"
                },
                {
                  "text": "降低功率，减少平民伤亡",
                  "next": {"chapter": 5, "scene": 1, "dialog": 6},
                  "consequence": "merciful"
                }
              ]
            },
            {
              "character": "田中健司",
              "text": "维持功率，开火！",
              "voice": "tanaka_fire.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shouting"}
            },
            {
              action:{"type": "jump_to_chapter","chapter": 10,"description": "进入终章：和平的黎明 - 代价结局"}
            },
            {
              "character": "田中健司",
              "text": "各单位注意，降低离子炮功率！",
              "voice": "tanaka_fire.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "shouting"}
            }
          ]
        },
        {
          "id": "scene5_3",
          "name": "天锤坠落",
          "background": "空间站爆炸.jpg",
          "bgm": "第五幕音乐.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "田中健司",
              "text": "命中目标！天锤结构严重受损......但它没有完全毁灭！它的轨道正在衰减......预测坠落地点......是刻耳柏洛斯的海上总部！",
              "voice": "tanaka_final1.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "那是一个大型石油平台改造的基地，位于太平洋中心！坠落冲击将造成灾难性后果！必须立即采取应对措施！",
              "voice": "tanaka_final2.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "坠落轨迹已经计算出来，冲击力将非常巨大。残骸分布范围很广，需要精确引导。",
              "voice": "tanaka_final3.mp3",
              "characterRight": {"image": "tanaka2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "残骸的撞击将引发全球性的海啸和生态灾难！估计会产生百米高的巨浪，所有沿海城市都将被淹没！",
              "voice": "eva_final_order1.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，你必须立刻前往海上平台，利用他们的控制系统，引导残骸安全坠入旁边的海沟！这将是我们最后的行动！",
              "voice": "eva_final_order2.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "已经调动了所有可用资源协助你，包括三个航母战斗群。但时间不多，残骸将在三十分钟内进入大气层。",
              "voice": "eva_final_order3.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "愿神盾与你同在，全人类都在期待你的成功！",
              "voice": "eva_final_order4.mp3",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "action": {
                "type": "jump_to_game",
                "description": "进入终局混战",
                "mapId": "map_chapter5_2",
                "availableUnits": ["assault_infantry", "sniper", "anti_tank_trooper", "main_battle_tank", "amphibious_tank", "destroyer", "submarine", "fighter_jet"],
                "enableFogOfWar": false,
                "aiDifficulty": "medium",
                "gameMode": "objective",
                "objectives": ["guide_debris:sea_trench"]
              }
            }
          ]
        },
        {
          "id": "scene5_4",
          "name": "任务成功",
          "background": "指挥中心.jpg",
          "bgm": "第五幕音乐.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们成功了！天锤的残骸已安全坠入海沟，全球危机解除了。",
              "voice": "eva_victory1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "smile"}
            },
            {
              "action": {"type": "jump_to_chapter","chapter": 8,"description": "进入终章：和平的黎明 - 完美结局"}
            }
          ]
        }
      ]
    },
    //胜利章节
    {
      "id": "chapter_victory",
      "title": "终章：和平的黎明",
      "scenes": [
        {
          "id": "victory_scene",
          "name": "胜利的曙光",
          "background": "sunrise.jpg",
          "bgm": "第六幕音乐.wav",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
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
              "text": "",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们失败了...部队损失惨重，必须重新评估战略。",
              "voice": "eva_fail1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "田中健司",
              "text": "敌人比我们预想的要强大。我需要时间分析数据，找出他们的弱点。",
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
    },
    // 完美
    {
      "id": "chapter_victory_perfect",
      "title": "终章：和平的黎明 - 完美结局",
      "scenes": [
        {
          "id": "victory_perfect_scene",
          "name": "完美胜利",
          "background": "sunrise.jpg",
          "bgm": "第六幕音乐.wav",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png", "expression": "smile"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "干得漂亮，指挥官！我们成功避免了全球灾难。残骸安全坠入马里亚纳海沟，只造成了有限的海洋生态影响，专家评估可在十年内自然恢复。",
              "voice": "eva_perfect1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "smile"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "国际科研团队已经前往该区域进行监测和评估。这是一个了不起的成就。你拯救了无数生命。",
              "voice": "eva_perfect2.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "smile"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "全球各地都在庆祝这场胜利，但我们也铭记那些牺牲的勇士。这场胜利属于全人类。",
              "voice": "eva_perfect3.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "田中健司",
              "text": "而且我们还获得了刻耳柏洛斯完整的数据库。数据显示他们已经在全球二十多个国家建立了分支机构，但核心领导层已在这次行动中被一网打尽。",
              "voice": "tanaka_perfect1.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "田中健司",
              "text": "我们已经开始协调国际行动清除这些残余势力，预计需要六个月时间完成全面清理。威胁正在被消除。世界正在恢复安全。",
              "voice": "tanaka_perfect2.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "田中健司",
              "text": "这些情报对我们未来的防御工作非常有价值。数据库中还发现了一些未启动的计划，我们已经着手处理。",
              "voice": "tanaka_perfect3.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "smile"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "国际社会已经开始联合清剿刻耳柏洛斯的残余势力。联合国已经通过特别决议，将神盾部队升级为全球性反恐机构，直接对安理会负责。",
              "voice": "eva_perfect4.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们的预算和权限都将大幅提升，可以更好地应对未来的全球性威胁。这是一个新的开始。我们将更加强大。",
              "voice": "eva_perfect5.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "全球合作进入了新阶段。各国都在加强情报共享和联合行动。",
              "voice": "eva_perfect6.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，你的英勇行动拯救了无数生命。虽然我们失去了很多战友，但他们的牺牲换来了世界的安全。",
              "voice": "eva_perfect7.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "各国领导人想要亲自为你授勋，但我觉得你会更喜欢实际的奖励——神盾部队将获得新一代装备的优先配备权，包括还在实验阶段的能量武器和隐身技术。",
              "voice": "eva_perfect8.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这是你应得的。感谢你的英勇表现。你的名字将被载入史册。未来还有很多挑战等着我们，我们需要你继续领导。",
              "voice": "eva_perfect9.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "proud"}
            },
            {
              "action": {
                "type": "show_ending",
                "ending": "perfect"
              }
            }
          ]
        }
      ]
    },
    // 牺牲
    {
      "id": "chapter_victory_sacrifice",
      "title": "终章：和平的黎明 - 牺牲结局",
      "scenes": [
        {
          "id": "victory_sacrifice_scene",
          "name": "牺牲的胜利",
          "background": "sunrise_dark.jpg",
          "bgm": "第六幕音乐.wav",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们已经尽力了......虽然避免了最坏的结果，但海啸还是对沿海地区造成了严重破坏。",
              "voice": "eva_sacrifice1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "初步估计，至少五十万人需要紧急疏散，经济损失不可估量。东京、上海、旧金山等城市都遭到了不同程度的破坏，救援工作正在全面展开。",
              "voice": "eva_sacrifice2.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这是一个沉重的代价。但我们别无选择。全球救援行动已经启动，但重建工作需要很长时间。",
              "voice": "eva_sacrifice3.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "受灾地区的重建将需要国际社会长期支持。",
              "voice": "eva_sacrifice4.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png", "expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "不过我们在最后时刻成功下载了刻耳柏洛斯的数据库。这些情报能帮助我们防止类似的危机再次发生。",
              "voice": "tanaka_sacrifice1.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "数据显示天锤只是他们众多计划中的一个，还有其他三个同样危险的项目正在推进，我们必须立即着手应对。",
              "voice": "tanaka_sacrifice2.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "战争还没有结束。我们需要保持警惕。这些情报对我们至关重要，可以帮助我们预防未来的危机。",
              "voice": "tanaka_sacrifice3.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "serious"}
            },
            {
              "character": "田中健司",
              "text": "数据库显示他们还在其他领域有秘密计划。",
              "voice": "tanaka_sacrifice4.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "损失是惨重的，但希望仍在。国际社会已经开始援助受灾地区，许多国家表示愿意加入我们的重建计划。",
              "voice": "eva_sacrifice5.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "中国提供了先进的救灾机器人，欧盟派来了医疗队，美国承诺承担大部分重建费用。",
              "voice": "eva_sacrifice6.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这是人类团结的时刻，我们要让世界看到，即使在最黑暗的时刻，人类也不会放弃希望。我们会重建得更好。",
              "voice": "eva_sacrifice7.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "全球合作展现了人类最好的一面。这场灾难让世界各国更加团结。",
              "voice": "eva_sacrifice8.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们需要重建，更需要你继续带领我们前进。这个世界仍然面临许多威胁，而你是我们最好的防御。",
              "voice": "eva_sacrifice9.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "理事会已经批准了\"凤凰计划\"，我们要在废墟上建立更好的防御体系，确保这样的悲剧不再发生。",
              "voice": "eva_sacrifice10.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你愿意继续担任这个重任吗，指挥官？世界需要你的领导。我们一起面对未来。",
              "voice": "eva_sacrifice11.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你的经验和领导力对我们至关重要。重建之路很漫长，但我们有信心。",
              "voice": "eva_sacrifice12.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "action": {
                "type": "show_ending",
                "ending": "sacrifice"
              }
            }
          ]
        }
      ]
    },
    // 代价
    {
      "id": "chapter_victory_cost",
      "title": "终章：和平的黎明 - 代价结局",
      "scenes": [
        {
          "id": "victory_cost_scene",
          "name": "沉重的胜利",
          "background": "sunrise_dark.jpg",
          "bgm": "第六幕音乐.wav",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "空间站已被摧毁......但是我们收到了坏消息。离子炮的能量过载引发了8.2级地震，北部三个省份受到严重影响。",
              "voice": "eva_cost1.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "初步报告显示超过一万五千人伤亡，数十万人无家可归。整个地区的基础设施完全瘫痪，可能需要十年时间才能完全恢复。",
              "voice": "eva_cost2.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这是一个痛苦的胜利。代价太大了。救援工作面临巨大挑战。灾区需要长期重建和支持。",
              "voice": "eva_cost3.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "田中健司",
              "text": "",
              "characterRight": {"image": "tanaka2.png", "expression": "worried"}
            },
            {
              "character": "田中健司",
              "text": "国际社会正在组织救援，但很多国家指责我们采取极端手段。联合国已经要求我们出席特别听证会，解释这次行动的决定过程。",
              "voice": "tanaka_cost1.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "worried"}
            },
            {
              "character": "田中健司",
              "text": "一些国家甚至要求解散神盾部队，认为我们权力过大且缺乏监管。这场争论可能会持续很久，影响深远。我们需要面对这些批评。",
              "voice": "tanaka_cost2.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "worried"}
            },
            {
              "character": "田中健司",
              "text": "这场辩论可能会改变国际安全格局。国际社会正在重新评估全球反恐策略。",
              "voice": "tanaka_cost3.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "worried"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们拯救了世界，但付出了惨重的代价。这场胜利将永远带着阴影。",
              "voice": "eva_cost4.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "许多家庭因为我们的决定而破碎，这个重量将永远压在我们肩上。我已经提交了辞呈，但被理事会拒绝了——他们说现在更需要稳定的领导，而不是逃避责任。",
              "voice": "eva_cost5.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们必须面对这个现实。共同承担责任。我们需要从这次经历中吸取教训。这场危机让我们认识到每个决定的重要性。",
              "voice": "eva_cost6.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "sad"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "理事会已经决定，神盾部队将全力参与灾后救援工作。我们需要重建的不仅是城市，还有人民对我们的信任。",
              "voice": "eva_cost7.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "这将是个漫长的过程，可能需要一代人的时间，我们必须坚持下去。这不是惩罚，而是赎罪。",
              "voice": "eva_cost8.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "我们必须对得起那些牺牲的人。重建工作将考验决心和能力。要用实际行动证明我们的价值，再次赢得人民的信任。",
              "voice": "eva_cost9.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "田中健司",
              "text": "我检测到刻耳柏洛斯的残余信号正在消失......他们似乎放弃了计划。但这真的是结束吗？或者只是另一个开始？",
              "voice": "tanaka_cost4.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "数据库显示他们还有多个备用计划正在执行，我们必须保持警惕。战争的形态正在改变，指挥官。",
              "voice": "tanaka_cost5.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "新时代需要新思维。科技发展带来新的威胁，我们必须与时俱进，适应新的环境。",
              "voice": "tanaka_cost6.mp3",
              "characterRight": {"image": "tanaka2.png", "expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "无论前路多么艰难，我们都必须继续前进。指挥官，你的选择拯救了数十亿人，但这个代价将永远提醒我们：每一个决定都值得深思。",
              "voice": "eva_cost11.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "从现在起，我们要建立更好的评估机制，确保不再出现这样的悲剧。这是对逝者最好的纪念，也是给生者一个交代。",
              "voice": "eva_cost12.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "让我们开始重建吧。为了更好的明天。人类的未来需要我们共同守护。我们要建立更加安全的未来。",
              "voice": "eva_cost13.mp3",
              "characterLeft": {"image": "eva2.png", "expression": "determined"}
            },
            {
              "action": {
                "type": "show_ending",
                "ending": "cost"
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