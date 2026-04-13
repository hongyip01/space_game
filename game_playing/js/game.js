class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.input = new InputHandler();
        this.ui = new UI(this);
        
        this.state = 'LOGIN'; // LOGIN, TUTORIAL, MAP, BATTLE, END
        this.startTime = 0;
        
        this.player = {
            id: '',
            x: 400,
            y: 300,
            width: 32,
            height: 32,
            speed: 3.2,
            hp: 40000,
            maxHp: 40000,
            fragments: 0
        };

        this.npcs = GAME_DATA.npcs.map(n => ({...n, status: 'LOCKED'})); // LOCKED, ACTIVE, DONE
        this.npcs[0].status = 'ACTIVE'; // First NPC active
        
        // 為每個 NPC 添加動畫配置（可擴展以支持未來的動畫怪物）
        const animationConfigs = {
            1: { isGif: true }, // monster1_video.gif: GIF 自動播放，無需手動幀控制
            4: null  // monster4: 暫無動畫
        };
        
        this.npcs.forEach((npc, idx) => {
            const monsterIdx = idx + 1; // NPC index 從 0 開始，怪物編號從 1 開始
            npc.animation = animationConfigs[monsterIdx] || null;
            npc.animationFrame = 0;
            npc.animationTime = 0;
        });
        
        this.currentMonster = null;
        this.monsterIndex = 0;
        this.tutorialStep = 0;
        this.tutorialCorrect = 0;
        this.gameTimer = 0;

        // --- 新增：圖片資源加載（等全部載入完才呼叫 init） ---
        this.assets = {
            map: new Image(),
            player: new Image(),
            pointer: new Image(),
            npcs: []
        };

        const totalToLoad = 3 + 4; // map, player, pointer + 4 NPCs
        let loadedCount = 0;
        const onAssetLoad = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                this.init();
            }
        };

        const onAssetError = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                this.init();
            }
        };

        this.assets.map.onload = onAssetLoad;
        this.assets.map.onerror = onAssetError;
        this.assets.map.src = 'assets/spaceMap.png';

        this.assets.player.onload = onAssetLoad;
        this.assets.player.onerror = onAssetError;
        this.assets.player.src = 'assets/player.png';

        this.assets.pointer.onload = onAssetLoad;
        this.assets.pointer.onerror = onAssetError;
        this.assets.pointer.src = 'assets/pointing.png'; // 如為 .jpg 副檔名請改

        // 加載 4 個 NPC 圖片到陣列
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.onload = onAssetLoad;
            img.onerror = onAssetError;
            // 第一個怪物使用動畫版本（GIF）
            img.src = (i === 1) ? `assets/monster1_video.gif` : `assets/monster${i}.png`;
            this.assets.npcs.push(img);
        }

        // 備援：如果 5 秒後還沒觸發 init()，強制呼叫（防止圖片載入問題導致卡住）
        setTimeout(() => {
            if (loadedCount < totalToLoad) {
                console.warn(`資源載入超時（${loadedCount}/${totalToLoad}），強制初始化遊戲`);
                this.init();
            }
        }, 5000);
    }

    init() {
        // Resize Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Login Button
        const loginBtn = document.getElementById('start-btn');
        const loginInput = document.getElementById('employee-id');

        const handleLogin = () => {
            const id = loginInput.value;
            if(id) {
                this.player.id = id;
                this.startTutorial();
            } else {
                alert("請輸入員工編號");
            }
        };

        loginBtn.addEventListener('click', handleLogin);
        loginInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        // Rules Button
        document.getElementById('rules-btn').addEventListener('click', () => {
            document.getElementById('rules-modal').classList.remove('hidden');
        });
        document.getElementById('close-rules-btn').addEventListener('click', () => {
            document.getElementById('rules-modal').classList.add('hidden');
        });

        // Dialogue Next Button
        document.getElementById('next-dialogue-btn').addEventListener('click', () => {
            this.advanceDialogue();
        });

        // Mouse Interaction
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'MAP') {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;
                this.checkMouseInteraction(clickX, clickY);
            }
        });

        // Start Loop
        requestAnimationFrame(() => this.loop());
        // Ensure mobile controls visibility matches device and state
        this.updateMobileControlsVisibility();
    }

    updateMobileControlsVisibility() {
        if (!this.ui || !this.ui.elements || !this.ui.elements.mobileControls) return;
        // 只在MAP狀態時顯示操控杆，其他狀態（包括BATTLE、MAP_DIALOGUE）都隱藏
        if (this.input && this.input.touchEnabled && this.state === 'MAP') {
            this.ui.elements.mobileControls.classList.remove('hidden');
        } else {
            this.ui.elements.mobileControls.classList.add('hidden');
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.repositionNPCs();
    }

    repositionNPCs() {
        // Safe Zone: Top 100px (HUD), Bottom 30% (Dialogue)
        const safeTop = 100;
        const safeBottom = this.canvas.height * 0.7;
        const safeLeft = 50;
        const safeRight = this.canvas.width - 50;
        
        // Divide into 4 quadrants
        const midX = this.canvas.width / 2;
        const midY = (safeTop + safeBottom) / 2;

        const quadrants = [
            { minX: safeLeft, maxX: midX - 50, minY: safeTop, maxY: midY - 50 },
            { minX: midX + 50, maxX: safeRight, minY: safeTop, maxY: midY - 50 },
            { minX: safeLeft, maxX: midX - 50, minY: midY + 50, maxY: safeBottom },
            { minX: midX + 50, maxX: safeRight, minY: midY + 50, maxY: safeBottom }
        ];

        this.npcs.forEach((npc, i) => {
            const q = quadrants[i % 4];
            npc.x = q.minX + Math.random() * (q.maxX - q.minX);
            npc.y = q.minY + Math.random() * (q.maxY - q.minY);
        });
    }

    startTutorial() {
        this.state = 'TUTORIAL';
        this.ui.showScreen('game-container'); // Just clears overlays
        this.ui.elements.loginScreen.classList.add('hidden');
        this.ui.elements.hud.classList.remove('hidden');
        // Mobile controls should appear only in MAP state on touch devices
        
        this.startTime = Date.now(); // Start timer here
        this.tutorialSequence();
    }

    tutorialSequence() {
        // Simple state machine for tutorial dialogue
        const prof = GAME_DATA.tutorial.professor;
        const doc = GAME_DATA.tutorial.doctor;
        
        // This is a simplified linear flow
        if (this.tutorialStep < prof.length) {
            this.ui.showDialogue(prof[this.tutorialStep].speaker, prof[this.tutorialStep].text);
        } else if (this.tutorialStep < prof.length + doc.length) {
            const idx = this.tutorialStep - prof.length;
            this.ui.showDialogue(doc[idx].speaker, doc[idx].text);
        } else {
            // Questions
            const qIdx = this.tutorialStep - (prof.length + doc.length);
            if (qIdx < GAME_DATA.tutorial.questions.length) {
                this.askTutorialQuestion(qIdx);
            } else {
                this.finishTutorial();
            }
        }
    }

    askTutorialQuestion(idx) {
        const q = GAME_DATA.tutorial.questions[idx];
        const options = q.options.map((opt, i) => ({
            text: opt,
            callback: () => {
                if (i === q.correct) this.tutorialCorrect++;
                this.tutorialStep++;
                this.tutorialSequence();
            }
        }));
        this.ui.showDialogue("博士", q.q, options);
    }

    advanceDialogue() {
        if (this.state === 'TUTORIAL') {
            // Only advance if no options are present
            if (this.ui.elements.dialogueOptions.classList.contains('hidden')) {
                this.tutorialStep++;
                this.tutorialSequence();
            }
        } else if (this.state === 'MAP_DIALOGUE') {
            this.npcDialogueIndex++;
            if (this.currentNpc && this.npcDialogueIndex < this.currentNpc.dialogue.length) {
                this.ui.showDialogue(this.currentNpc.name, this.currentNpc.dialogue[this.npcDialogueIndex]);
            } else {
                this.state = 'MAP';
                this.ui.hideDialogue();
                // Trigger battle transition
                this.startBattle(this.monsterIndex);
            }
        }
    }

    finishTutorial() {
        let bonus = 0;
        if (this.tutorialCorrect === 1) bonus = 2000;
        if (this.tutorialCorrect === 2) bonus = 4000;
        if (this.tutorialCorrect === 3) bonus = 6000;

        this.player.maxHp = 40000 + bonus;
        this.player.hp = this.player.maxHp;

        const msg = `教學結束！你答對了 ${this.tutorialCorrect} 題。\n獲得血量加成: +${bonus}！\n當前血量: ${this.player.hp}`;
        
        this.ui.showDialogue("系統", msg, [{
            text: "開始冒險",
            callback: () => {
                this.ui.hideDialogue();
                this.state = 'MAP';
                
                // 啟動第一個 NPC 以供交互
                if (this.monsterIndex < this.npcs.length) {
                    this.npcs[this.monsterIndex].status = 'ACTIVE';
                    console.log('✅ 啟動第一個 NPC:', this.npcs[this.monsterIndex].name);
                }
                
                this.ui.updateHUD();
                this.updateMobileControlsVisibility();
            }
        }]);
    }

    startBattle(monsterIdx) {
        console.log('🔴 開始戰鬥 - 怪物索引:', monsterIdx);
        this.state = 'BATTLE';
        this.currentMonster = JSON.parse(JSON.stringify(GAME_DATA.monsters[monsterIdx])); // Deep copy
        this.currentMonster.qIndex = 0;
        console.log('怪物對象:', this.currentMonster);
        this.ui.showBattle(this.currentMonster);
        this.battleSequence();
    }

    battleSequence() {
        console.log('⚔️ battleSequence - qIndex:', this.currentMonster.qIndex);
        const m = this.currentMonster;
        // Show dialogue first
        if (m.qIndex === 0) {
             console.log('展示怪物對白:', m.dialogue[0]);
             document.getElementById('battle-question-text').innerText = m.dialogue[0];
             this.renderBattleOptions([{text: "來吧！", callback: () => {
                 m.qIndex = 0.5; // Flag to start Q1
                 this.battleSequence();
             }}]);
             return;
        }

        if (m.qIndex === 0.5) {
            console.log('詢問第一題');
            this.askBattleQuestion(0);
        } else if (m.qIndex === 1.5) {
            console.log('詢問第二題');
            this.askBattleQuestion(1);
        }
    }

    askBattleQuestion(qIdx) {
        console.log('📝 askBattleQuestion - qIdx:', qIdx);
        const q = this.currentMonster.questions[qIdx];
        console.log('問題:', q);
        document.getElementById('battle-question-text').innerText = q.q;
        
        // 播放提問音效
        if (window.SOUND_EFFECTS) {
            SOUND_EFFECTS.play('question');
        }
        
        const opts = q.options.map((opt, i) => ({
            text: opt,
            callback: () => {
                console.log('選中選項', i, '正確答案是', q.correct);
                this.handleBattleAnswer(i === q.correct);
            }
        }));
        this.renderBattleOptions(opts);
    }

    renderBattleOptions(options) {
        const container = document.getElementById('battle-answers');
        container.innerHTML = '';
        
        // Hide next button in battle UI if it exists (though battle UI structure is different)
        // But we need to make sure we don't show "Next" arrow if we are in battle question mode
        // Actually battle UI is separate from dialogue box, so we are good.
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'pixel-btn answer-btn';
            btn.innerText = opt.text;
            btn.onclick = opt.callback;
            container.appendChild(btn);
        });
    }

    handleBattleAnswer(isCorrect) {
        console.log('✅ handleBattleAnswer - isCorrect:', isCorrect);
        // Handle HP deduction immediately for wrong answers
        if (!isCorrect) {
            console.log('❌ 答錯，扣血 4000');
            this.player.hp -= 4000;
            this.triggerEffect('shake');
            this.ui.updateHUD();
            
            if (this.player.hp <= 0) {
                console.log('💀 角色死了，遊戲結束');
                this.endGame(false);
                return;
            }
        } else {
            // Correct Answer: Damage Monster
            this.currentMonster.hp -= 2000;
            this.ui.updateMonsterHP(this.currentMonster.hp, 4000);
            
            // Shake Monster Effect
            const monsterSprite = document.getElementById('monster-sprite');
            if (monsterSprite) {
                monsterSprite.classList.add('shake');
                setTimeout(() => monsterSprite.classList.remove('shake'), 500);
            }
        }

        if (this.currentMonster.qIndex === 0.5) {
            // Question 1 Finished
            this.currentMonster.q1Correct = isCorrect;
            
            // Directly jump to Question 2
            this.currentMonster.qIndex = 1.5;
            setTimeout(() => this.battleSequence(), 500); // Delay for visual feedback
            
        } else {
            // Question 2 Finished
            const q2Correct = isCorrect;
            
            // Check Win Condition: Both must be correct
            if (this.currentMonster.q1Correct && q2Correct) {
                // WIN
                this.ui.showDialogue("系統", "獲得怪物碎片！成功拯救了這個星球！", [{
                    text: "繼續前進",
                    callback: () => this.winBattle()
                }]);
            } else {
                // LOSE (One or both wrong)
                this.ui.showDialogue(this.currentMonster.name, "你無法打敗我，你輸了...", [{
                    text: "撤退",
                    callback: () => {
                        this.ui.hideDialogue();
                        this.state = 'MAP';
                        this.ui.showScreen('game-container');
                        this.ui.elements.hud.classList.remove('hidden');
                        this.updateMobileControlsVisibility();
                    }
                }]);
            }
        }
    }

    triggerEffect(type) {
        const screen = document.getElementById('game-container');
        if (type === 'shake') {
            screen.classList.add('shake');
            setTimeout(() => screen.classList.remove('shake'), 500);
        }
    }

    winBattle() {
        console.log('🎉 winBattle - 戰鬥勝利');
        this.player.fragments++;
        console.log('💎 收集碎片:', this.player.fragments, '/4');
        this.ui.updateHUD();
        this.ui.hideDialogue(); // Hide the win message
        
        // Update NPC states
        this.npcs[this.monsterIndex].status = 'DONE';
        this.monsterIndex++;
        
        if (this.monsterIndex < this.npcs.length) {
            this.npcs[this.monsterIndex].status = 'ACTIVE';
        }

        if (this.player.fragments >= 4) {
            console.log('🏆 收集到4個碎片，遊戲結束！');
            this.endGame(true);
        } else {
            this.state = 'MAP';
            this.ui.showScreen('game-container'); // Back to map
            this.ui.elements.loginScreen.classList.add('hidden');
            this.ui.elements.hud.classList.remove('hidden');
            this.updateMobileControlsVisibility();
        }
    }
//
async endGame(win) {
    this.state = 'END';
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    
    // 準備數據
    const stats = {
        id: this.player.id,
        fragments: this.player.fragments,
        hp: this.player.hp,
        play_time: timeSpent
    };
    
    console.log('=== 遊戲結束 ===');
    console.log('準備發送的 stats:', stats);
    
    let leaderboard = [];
    
    try {
        // 向 Cloudflare Worker 提交分數
        console.log('開始發送分數到 Worker...');
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stats)
        });
        
        console.log('Worker 響應狀態:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 分數成功提交');
            leaderboard = result.leaderboard || [];
        } else {
            console.warn('⚠️ Worker 返回非 200 狀態:', response.status);
            leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        }
    } catch (error) {
        console.error('❌ 提交分數失敗:', error);
        leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    }
    
    // 本地備降
    if (leaderboard.length === 0) {
        console.log('使用本地存儲備降...');
        leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        leaderboard.push(stats);

        leaderboard.sort((a, b) => {
            if (b.fragments !== a.fragments) return b.fragments - a.fragments;
            if (b.hp !== a.hp) return b.hp - a.hp;
            return (a.play_time || 0) - (b.play_time || 0);
        });

        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        console.log('✅ 數據已存儲到本地');
    }

    document.getElementById('end-title').innerText = win ? "通關成功!" : "游戲結束";
    this.ui.showEndScreen(stats, leaderboard);
}

    update() {
        // Update mobile controls visibility based on current state
        this.updateMobileControlsVisibility();
        
        // Update Timer
        if (this.state !== 'LOGIN' && this.state !== 'END') {
            const now = Date.now();
            const diff = Math.floor((now - this.startTime) / 1000);
            this.ui.updateTimer(diff);
        }

        if (this.state === 'MAP') {
            // Movement
            let nextX = this.player.x;
            let nextY = this.player.y;

            if (this.input.keys.up) nextY -= this.player.speed;
            if (this.input.keys.down) nextY += this.player.speed;
            if (this.input.keys.left) nextX -= this.player.speed;
            if (this.input.keys.right) nextX += this.player.speed;

            // Boundaries & Safe Zones
            // Safe Zone: Top 80px (HUD), Bottom 30% (Dialogue)
            const safeTop = 80;
            const safeBottom = this.canvas.height * 0.7;
            
            // Clamp to safe area
            nextX = Math.max(0, Math.min(this.canvas.width - this.player.width, nextX));
            nextY = Math.max(safeTop, Math.min(safeBottom - this.player.height, nextY));

            this.player.x = nextX;
            this.player.y = nextY;

            // Interaction
            if (this.input.keys.interact) {
                this.checkInteraction();
                this.input.resetInteract();
            }
        }
    }

    checkInteraction() {
        if (this.state !== 'MAP') return;
        
        for (let npc of this.npcs) {
            if (npc.status === 'ACTIVE') {
                if (this.isPlayerCloseTo(npc)) {
                    this.triggerNpcInteraction(npc);
                    return;
                }
            }
        }
    }

    checkMouseInteraction(mx, my) {
        for (let npc of this.npcs) {
            if (npc.status === 'ACTIVE') {
                // Check if click is within NPC bounds (32x32)
                if (mx >= npc.x && mx <= npc.x + 32 &&
                    my >= npc.y && my <= npc.y + 32) {
                    
                    if (this.isPlayerCloseTo(npc)) {
                        this.triggerNpcInteraction(npc);
                    }
                }
            }
        }
    }

    isPlayerCloseTo(npc) {
        const p = this.player;
        // Calculate distance between edges (Expanded proximity)
        const dx = Math.max(0, npc.x - (p.x + p.width), p.x - (npc.x + 32));
        const dy = Math.max(0, npc.y - (p.y + p.height), p.y - (npc.y + 32));
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist <= 50; // Expanded from 5 to 50
    }

    triggerNpcInteraction(npc) {
        this.state = 'MAP_DIALOGUE';
        this.currentNpc = npc;
        this.npcDialogueIndex = 0;
        this.ui.showDialogue(npc.name, npc.dialogue[0]);
    }

    draw() {
        // Clear canvas with black background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'MAP' || this.state === 'MAP_DIALOGUE') {
            // Draw Map Background Image
            if (this.assets && this.assets.map && this.assets.map.complete) {
                this.ctx.drawImage(this.assets.map, 0, 0, this.canvas.width, this.canvas.height);
            }

            // Draw NPCs
            this.npcs.forEach((npc, index) => {
                // 設定 NPC 透明度（LOCKED 的 NPC 半透明）
                if (npc.status === 'LOCKED') {
                    this.ctx.globalAlpha = 0.5;
                } else {
                    this.ctx.globalAlpha = 1.0;
                }
                
                // 繪製怪物圖片（使用預先載入的 assets.npcs 陣列）
                if (this.assets && this.assets.npcs && this.assets.npcs[index] && this.assets.npcs[index].complete) {
                    const monsterImg = this.assets.npcs[index];
                    const monsterDisplayWidth = 150;  // 顯示大小（地圖 1/5 尺寸）
                    const monsterDisplayHeight = 150;
                    
                    // 檢查是否是 GIF 動畫（無需手動幀控制，直接繪製）
                    if (npc.animation && npc.animation.isGif) {
                        // GIF 自動播放：直接繪製，浏覽器會自動處理動畫
                        this.ctx.drawImage(monsterImg, npc.x, npc.y, monsterDisplayWidth, monsterDisplayHeight);
                    } else {
                        // 靜態圖片：直接繪製
                        this.ctx.drawImage(monsterImg, npc.x, npc.y, monsterDisplayWidth, monsterDisplayHeight);
                    }
                } else {
                    // 備援：如果圖片未載入，畫色塊
                    this.ctx.fillStyle = npc.spriteColor;
                    this.ctx.fillRect(npc.x, npc.y, 150, 150);
                }
                this.ctx.globalAlpha = 1.0;
                
                // 在 ACTIVE NPC 上方繪製 pointing.png 指示圖
                if (npc.status === 'ACTIVE') {
                    if (this.assets && this.assets.pointer && this.assets.pointer.complete) {
                        const pw = 65; 
                        const ph = 65;
                        const px = npc.x + 24 - pw / 2; // 居中於怪物頭頂（怪物寬 48，中心 +24）
                        const py = npc.y - ph - 5; // 在怪物頭頂上方
                        this.ctx.drawImage(this.assets.pointer, px, py, pw, ph);
                    } else {
                        // 備援：如果圖片未載入，畫紅點與箭頭
                        this.ctx.fillStyle = 'red';
                        this.ctx.beginPath();
                        this.ctx.arc(npc.x + 16, npc.y - 15, 5, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = '12px Arial';
                        this.ctx.fillText('▼', npc.x + 10, npc.y - 20);
                    }
                }
            });

            // Draw Player
            if (this.assets && this.assets.player && this.assets.player.complete) {
                this.ctx.drawImage(this.assets.player, this.player.x, this.player.y, 64, 64);
            } else {
                // 備援：如果圖片未載入，畫白色矩形
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}
