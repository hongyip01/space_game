class InputHandler {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            interact: false
        };

        // Detect if device supports touch (mobile/tablet)
        this.touchEnabled = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            switch((e.key || '').toLowerCase()) {
                case 'w': case 'arrowup': this.keys.up = true; break;
                case 's': case 'arrowdown': this.keys.down = true; break;
                case 'a': case 'arrowleft': this.keys.left = true; break;
                case 'd': case 'arrowright': this.keys.right = true; break;
                case 'e': case 'enter': case ' ': 
                    this.keys.interact = true; 
                    // Prevent repeat firing for interaction if held
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch((e.key || '').toLowerCase()) {
                case 'w': case 'arrowup': this.keys.up = false; break;
                case 's': case 'arrowdown': this.keys.down = false; break;
                case 'a': case 'arrowleft': this.keys.left = false; break;
                case 'd': case 'arrowright': this.keys.right = false; break;
                case 'e': case 'enter': case ' ': this.keys.interact = false; break;
            }
        });
    }

    initTouch() {
        // 虛擬搖杆邏輯
        const joystickBg = document.getElementById('joystick-bg');
        const joystickStick = document.getElementById('joystick-stick');
        const interactBtn = document.getElementById('btn-interact');
        
        if (!joystickBg || !joystickStick) return;
        
        // 搖杆參數
        const radius = 70; // 搖杆背景半徑
        const stickRadius = 25; // 搖杆棒半徑
        let isJoystickTouching = false;
        
        const resetJoystick = () => {
            joystickStick.style.transform = 'translate(-50%, -50%)';
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
        };
        
        const updateJoystick = (x, y) => {
            const bgRect = joystickBg.getBoundingClientRect();
            const centerX = bgRect.width / 2;
            const centerY = bgRect.height / 2;
            
            const dx = x - bgRect.left - centerX;
            const dy = y - bgRect.top - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let moveX = dx;
            let moveY = dy;
            
            // 限制搖杆最大偏移距離
            if (distance > radius) {
                const ratio = radius / distance;
                moveX *= ratio;
                moveY *= ratio;
            }
            
            // 更新搖杆視覺位置
            joystickStick.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            
            // 根據偏移量更新按鍵狀態
            const threshold = 30; // 閾值
            this.keys.up = moveY < -threshold;
            this.keys.down = moveY > threshold;
            this.keys.left = moveX < -threshold;
            this.keys.right = moveX > threshold;
        };
        
        // 滑鼠（桌面測試）
        joystickBg.addEventListener('mousedown', (e) => {
            isJoystickTouching = true;
            updateJoystick(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isJoystickTouching) {
                updateJoystick(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isJoystickTouching) {
                isJoystickTouching = false;
                resetJoystick();
            }
        });
        
        // 觸摸（行動設備）
        joystickBg.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isJoystickTouching = true;
            const touch = e.touches[0];
            updateJoystick(touch.clientX, touch.clientY);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isJoystickTouching) {
                const touch = e.touches[0];
                updateJoystick(touch.clientX, touch.clientY);
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isJoystickTouching) {
                isJoystickTouching = false;
                resetJoystick();
            }
        });
        
        // A 按鈕（互動）
        if (interactBtn) {
            interactBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.interact = true;
            });
            interactBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.interact = false;
            });
            interactBtn.addEventListener('mousedown', () => {
                this.keys.interact = true;
            });
            interactBtn.addEventListener('mouseup', () => {
                this.keys.interact = false;
            });
        }
    }

    resetInteract() {
        this.keys.interact = false;
    }
}
