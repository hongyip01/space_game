class UI {
    constructor(game) {
        this.game = game;
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            hud: document.getElementById('hud'),
            dialogueBox: document.getElementById('dialogue-box'),
            battleScreen: document.getElementById('battle-screen'),
            endScreen: document.getElementById('end-screen'),
            hpFill: document.getElementById('player-hp-fill'),
            hpText: document.getElementById('hp-text'),
            fragmentCount: document.getElementById('fragment-count'),
            speakerName: document.getElementById('speaker-name'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueOptions: document.getElementById('dialogue-options'),
            monsterHpFill: document.getElementById('monster-hp-fill'),
            battleQuestionText: document.getElementById('battle-question-text'),
            battleAnswers: document.getElementById('battle-answers'),
            mobileControls: document.getElementById('mobile-controls'),
            timer: document.getElementById('game-timer')
        };

        // --- 新增：頭像映射表 ---
        this.portraitMap = {
            "諾華教授": "assets/professor.jpeg",
            "熔岩巨獸": "assets/monster1.png",
            "煙霧幽靈": "assets/monster2.png",
            "火焰翼龍": "assets/monster3.png",
            "爆炸甲蟲": "assets/monster4.png",
            "default": "assets/player.png" // 默認玩家頭像
        };
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        // Show requested
        const el = document.getElementById(screenId);
        if(el) el.classList.remove('hidden');
    }

    updateHUD() {
        const hpPercent = Math.max(0, (this.game.player.hp / this.game.player.maxHp) * 100);
        this.elements.hpFill.style.width = `${hpPercent}%`;
        this.elements.hpText.innerText = `${this.game.player.hp}/${this.game.player.maxHp}`;
        this.elements.fragmentCount.innerText = `${this.game.player.fragments}/4`;
    }

    updateTimer(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        this.elements.timer.innerText = `${m}:${s}`;
    }

    showDialogue(speaker, text, options = null) {
        this.elements.dialogueBox.classList.remove('hidden');
        this.elements.speakerName.innerText = speaker;
        this.elements.dialogueText.innerText = text;
        
        // --- 新增：設置頭像 ---
        const portraitDiv = document.getElementById('portrait');
        // 如果 speaker 在映射表中，就用對應圖片，否則用默認（玩家）
        const imgUrl = this.portraitMap[speaker] || this.portraitMap['default'];
        
        // 設置背景圖片
        portraitDiv.style.backgroundImage = `url('${imgUrl}')`;
        portraitDiv.style.backgroundSize = 'cover'; // 確保圖片填滿
        portraitDiv.style.backgroundPosition = 'center';
        // ---------------------

        this.elements.dialogueOptions.innerHTML = '';

        const nextBtn = document.getElementById('next-dialogue-btn');

        if (options) {
            this.elements.dialogueOptions.classList.remove('hidden');
            nextBtn.classList.add('hidden'); // Hide next button when options are present
            
            options.forEach((opt, index) => {
                const btn = document.createElement('button');
                btn.className = 'pixel-btn small';
                btn.innerText = opt.text;
                btn.onclick = () => opt.callback();
                this.elements.dialogueOptions.appendChild(btn);
            });
        } else {
            this.elements.dialogueOptions.classList.add('hidden');
            nextBtn.classList.remove('hidden'); // Show next button when no options
        }
    }

    hideDialogue() {
        this.elements.dialogueBox.classList.add('hidden');
    }

    showBattle(monster) {
        this.showScreen('battle-screen');
        this.elements.hud.classList.remove('hidden'); 
        this.updateMonsterHP(monster.hp, 4000);
        
        // --- 修改：設置怪獸大圖 ---
        const monsterSprite = document.getElementById('monster-sprite');
        // 清除背景色
        monsterSprite.style.backgroundColor = 'transparent';
        // 設置圖片
        monsterSprite.style.backgroundImage = `url('assets/monster${monster.id}.png')`;
        monsterSprite.style.backgroundSize = 'contain'; // 保持比例顯示
        monsterSprite.style.backgroundRepeat = 'no-repeat';
        monsterSprite.style.backgroundPosition = 'center bottom';
        // -------------------------
    }

    updateMonsterHP(current, max) {
        const p = (current / max) * 100;
        this.elements.monsterHpFill.style.width = `${p}%`;
    }

    getMonsterColor(id) {
        const colors = ['#e74c3c', '#3498db', '#f1c40f', '#8e44ad'];
        return colors[id-1] || '#fff';
    }

    showEndScreen(stats, leaderboard) {
        this.showScreen('end-screen');
        this.elements.hud.classList.add('hidden');
        this.elements.mobileControls.classList.add('hidden');
        
        // 優先使用傳入的 stats，若缺值則從 localStorage 回退（供 RPG Maker 傳值）
        const playerName = (stats && stats.id) ? stats.id : (localStorage.getItem('rpg_player_name') || '玩家');
        const playTime = (stats && stats.play_time !== undefined) ? `${stats.play_time}s` : '00:00';
        const level = (stats && (stats.level !== undefined && stats.level !== null)) ? stats.level : (localStorage.getItem('rpg_player_level') || '—');

        document.getElementById('end-employee-id').innerText = playerName;
        document.getElementById('end-time').innerText = playTime;
        document.getElementById('end-level').innerText = level;
        document.getElementById('end-hp').innerText = (stats && stats.hp !== undefined) ? stats.hp : (localStorage.getItem('rpg_player_hp') || '0');
        document.getElementById('end-fragments').innerText = (stats && stats.fragments !== undefined) ? stats.fragments : (localStorage.getItem('rpg_player_fragments') || '0');

        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        leaderboard.forEach((entry, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${i+1}</td>
                <td>${entry.id}</td>
                <td>${entry.fragments}</td>
                <td>${entry.hp}</td>
                <td>${entry.play_time}s</td>
            `;
            tbody.appendChild(tr);
        });
    }
}
