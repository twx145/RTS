//修改所有的action为单独的dialog
window.scriptData = {
  "title": "神盾计划",
  "chapters": [
    {
      "id": "chapter1",
      "title": "第一章：沙暴中的回响",
      "scenes": [
        {
          "id": "scene1_1",
          "name": "任务简报",
          "background": "desert_base.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，欢迎上任。我们在撒哈拉沙漠边缘的哨站回声-7已经失联超过24小时。你的任务是带领突击步兵小队前往调查。",
              "voice": "eva_briefing1.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "保持警惕，如果遇到敌对势力，授权你使用致命武力。查明情况，回收数据，然后撤离。",
              "voice": "eva_briefing2.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"},
            },
            {
              "action": {"type": "jump_to_game","description": "开始第一章任务"}
            }
          ]
        },
        {
          "id": "scene1_2",
          "name": "突袭与撤离",
          "background": "desert_battle.png",
          "bgm": "battle_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "是埋伏！击退他们，指挥官！撤离点已重新规划至东南侧直升机着陆区，坚持住！",
              "voice": "eva_battle_alert.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "alert"}
            }
          ]
        },
        {
          "id": "scene1_3",
          "name": "任务结束",
          "background": "command_center.png",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "指挥官，干得漂亮。我们从哨站数据中找到加密标记......刻耳柏洛斯？我从没听说过这个组织。",
              "voice": "tanaka_data.mp3",
              "characterRight": {"image": "tanaka.jpg","expression": "thinking"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "刻耳柏洛斯......我曾在黑市武器流水号上见过这个标志。提高警戒！下一步，我们去安第斯峡谷。",
              "voice": "eva_next.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"},
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
          "background": "canyon_base.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，健司已经确认峡谷中隐藏着一个刻耳柏洛斯训练和后勤基地。我们必须拔掉这颗钉子。",
              "voice": "eva_canyon1.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你将获得突击步兵、狙击手、反坦克兵和轻型坦克的支援。摧毁军火库、兵营和指挥中心！",
              "voice": "eva_canyon2.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"} 
            },
            {
              "action": {"type": "jump_to_game","description": "开始第二章任务"}
            }
          ]
        },
        {
          "id": "scene2_2",
          "name": "任务结束",
          "background": "canyon_ruins.png",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "指挥官，我接收到了数据流......这是一份运输日志！他们从阿尔法研究所抢走了同位素核心！",
              "voice": "tanaka_core.mp3",
              "characterRight": {"image": "tanaka.jpg","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "阿尔法研究所？那是最高机密能源项目！立刻联系他们！指挥官，我们必须阻止运输！",
              "voice": "eva_core.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "alert"},
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
          "background": "city_neon.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们必须在新京都市区找到并消灭毒蛇的指挥总部。他掌握同位素核心情报。",
              "voice": "eva_city1.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "你将获得全面支援，包括主战坦克、战机和榴弹炮。但小心城市防空！",
              "voice": "eva_city2.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "action": {"type": "jump_to_game","description": "开始第三章任务"}
            }
          ]
        },
        {
          "id": "scene3_2",
          "name": "毒蛇的狂言",
          "background": "city_battle.png",
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
          "background": "command_center.png",
          "bgm": "intel_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "天锤......他临死前反复提到。健司，查清楚！",
              "voice": "eva_hammer.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "thinking"}
            },
            {
              "character": "田中健司",
              "text": "天啊！天锤是冷战时期的轨道攻击系统！如果他们激活它......全球格局将被颠覆！",
              "voice": "tanaka_hammer.mp3",
              "characterRight": {"image": "tanaka.jpg","expression": "shocked"},
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
          "background": "arctic_base.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，天锤控制基地就在北极。摧毁三个能源站，解除护盾，然后强攻主控塔！",
              "voice": "eva_arctic.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "action": {"type": "jump_to_game","description": "开始第四章任务"}
            }
          ]
        },
        {
          "id": "scene4_2",
          "name": "AI失控",
          "background": "arctic_core.png",
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
              "characterRight": {"image": "tanaka.jpg","expression": "panic"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，立刻撤离！我们需要新的战术！",
              "voice": "eva_retreat.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "alert"}
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
          "background": "mountain_cannon.png",
          "bgm": "briefing_bgm.mp3",
          "dialogs": [
            {
              "character": "伊娃·罗斯托娃",
              "text": "指挥官，我们没有时间了！护送充能车到离子炮阵地，击落天锤！这是最后的希望！",
              "voice": "eva_final.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "action": {"type": "jump_to_game","description": "开始第五章任务"}
            }
          ]
        },
        {
          "id": "scene5_2",
          "name": "任务结束",
          "background": "ocean_base.png",
          "bgm": "ending_bgm.mp3",
          "dialogs": [
            {
              "character": "田中健司",
              "text": "命中目标！但天锤没有完全毁灭！它正在坠落，目标是刻耳柏洛斯海上总部！",
              "voice": "tanaka_final.mp3",
              "characterRight": {"image": "tanaka.jpg","expression": "serious"}
            },
            {
              "character": "伊娃·罗斯托娃",
              "text": "撞击将引发全球灾难！指挥官，前往海上平台，引导残骸坠入海沟！这是最后一战！",
              "voice": "eva_final_order.mp3",
              "characterLeft": {"image": "eva.jpg","expression": "serious"}
            },
            {
              "action": {"type": "jump_to_game","description": "进入终局混战"}
            }
          ]
        }
      ]
    }
  ]
}
