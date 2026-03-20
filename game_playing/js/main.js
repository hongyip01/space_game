const BG_MUSIC = {
    audio: null,
    src: null,
    autoplayAfterUnlock: false,
    init(src, opts = {}) {
        this.src = src;
        this.audio = new Audio();
        this.audio.src = src;
        this.audio.loop = opts.loop ?? true;
        this.audio.volume = opts.volume ?? 0.5;
        this.audio.preload = 'auto';
        this.audio.addEventListener('error', (e) => console.warn('BG music load error', e));
        this.audio.load();

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
        this.audio.play().catch(() => {/* autoplay blocked */});
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
    // 初始化背景音樂（請把檔案放到 assets/sounds/bg-music.mp3）
    BG_MUSIC.init('assets/sounds/bg-music.mp3', { loop: true, volume: 0.4 });
    // 若要在首次互動後自動播放，設定為 true；否則使用者需手動按鈕或鍵盤切換
    BG_MUSIC.autoplayAfterUnlock = true;

    const game = new Game();

    // 範例：按下 M 鍵可切換背景音樂
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') BG_MUSIC.toggle();
    });

    // 對外暴露簡單 API 供 UI 或其他模組呼叫
    window.playBackgroundMusic = () => BG_MUSIC.play();
    window.pauseBackgroundMusic = () => BG_MUSIC.pause();
    window.toggleBackgroundMusic = () => BG_MUSIC.toggle();
};
