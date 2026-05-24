// client/src/utils/haptics.ts
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    return audioCtx;
}
export function playSound(type) {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        if (type === 'click' || type === 'swipe') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
        else if (type === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.1);
            osc.frequency.setValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
        else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }
    catch (e) {
        // Ignore audio errors
    }
}
export function vibrate(type) {
    if (!navigator.vibrate)
        return;
    try {
        switch (type) {
            case 'light':
                navigator.vibrate(20);
                break;
            case 'medium':
                navigator.vibrate(40);
                break;
            case 'heavy':
                navigator.vibrate(80);
                break;
            case 'success':
                navigator.vibrate([30, 50, 40]);
                break;
            case 'error':
                navigator.vibrate([60, 40, 60]);
                break;
        }
    }
    catch (e) {
        // Ignore vibrate errors
    }
}
export function triggerHaptic(type) {
    playSound(type);
    if (type === 'click' || type === 'swipe')
        vibrate('light');
    else if (type === 'correct')
        vibrate('success');
    else if (type === 'wrong')
        vibrate('error');
}
