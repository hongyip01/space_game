const SOUND_EFFECTS = {
    sounds: {},
    init() {
        // 初始化各種音效
        this.sounds = {
            question: new Audio('assets/sounds/question.mp3'),
            correct: new Audio('assets/sounds/correct.mp3'),
            wrong: new Audio('assets/sounds/wrong.mp3')
        };
        // 設置音量
        Object.values(this.sounds).forEach(audio => {
            audio.volume = 0.6;
        });
    },
    play(soundName) {
        const audio = this.sounds[soundName];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch((err) => console.warn(`音效播放失敗 (${soundName}):`, err));
        }
    }
};

const BG_MUSIC = {
    audio: null,
    autoplayAfterUnlock: false,
    init(opts = {}) {
        // 使用HTML中已存在的audio元素
        this.audio = document.getElementById('bgMusic');
        if (!this.audio) {
            console.warn('BG music element not found');
            return;
        }
        this.audio.loop = opts.loop ?? true;
        this.audio.volume = opts.volume ?? 0.4;
        this.audio.addEventListener('error', (e) => console.warn('BG music load error', e));

        const unlock = () => {
            window.removeEventListener('pointerdown', unlock);
            // 嘗試播放再暫停以解鎖部分瀏覽器的播放權限
            this.audio.play().then(() => {
                if (!this.autoplayAfterUnlock) {
                    this.audio.pause();
                    this.audio.currentTime = 0;
                }
            }).catch(() => {/* autoplay 被阻擋，等待使用者顯式呼叫 */});
            if (this.autoplayAfterUnlock) this.play();
        };
        window.addEventListener('pointerdown', unlock, { once: true });
    },
    play() {
        if (!this.audio) return;
        this.audio.play().catch((err) => console.warn('Play failed:', err));
    },
    pause() {
        if (!this.audio) return;
        this.audio.pause();
    },
    toggle() {
        if (!this.audio) return;
        if (this.audio.paused) this.play(); else this.pause();
    },
    isPlaying() { return this.audio && !this.audio.paused; }
};

window.onload = () => {
    // 初始化背景音樂（使用HTML中的音頻元素）
    BG_MUSIC.init({ loop: true, volume: 0.4 });
    // 若要在首次互動後自動播放，設定為 true；否則使用者需手動按鈕或鍵盤切換
    BG_MUSIC.autoplayAfterUnlock = true;

    // 初始化音效系統
    SOUND_EFFECTS.init();

    const game = new Game();

    // 登錄系統按鈕：玩家輸入員工編號並點擊時播放背景音樂
    const startBtn = document.getElementById('start-btn');
    const employeeIdInput = document.getElementById('employee-id');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const employeeId = employeeIdInput?.value.trim();
            if (employeeId) {
                // 員工編號已輸入，開始遊戲並播放音樂
                BG_MUSIC.play();
                console.log('遊戲開始，員工編號: ' + employeeId);
            } else {
                // 員工編號未輸入，顯示提示
                alert('請輸入員工編號');
            }
        });
    }

    // 範例：按下 M 鍵可切換背景音樂
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') BG_MUSIC.toggle();
    });

    // 對外暴露簡單 API 供 UI 或其他模組呼叫
    window.playBackgroundMusic = () => BG_MUSIC.play();
    window.pauseBackgroundMusic = () => BG_MUSIC.pause();
    window.toggleBackgroundMusic = () => BG_MUSIC.toggle();
};
