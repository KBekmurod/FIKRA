import { create } from 'zustand';
export const useEntityStore = create((set, get) => ({
    mode: 'hidden',
    isVisible: false,
    isPrankingLevel: false,
    isMatrixMode: false,
    isScreenWiped: false,
    isThiefActive: false,
    prankMessage: '',
    tutorialStep: 0,
    setMode: (mode) => set({ mode }),
    setVisibility: (isVisible) => set({ isVisible }),
    setTutorialStep: (step) => set({ tutorialStep: step, isVisible: step > 0 }),
    startTutorial: () => {
        set({ tutorialStep: 1, isVisible: true, mode: 'converse' });
    },
    nextTutorialStep: () => {
        set((state) => {
            const next = state.tutorialStep + 1;
            if (next > 3) {
                return { tutorialStep: 0, isVisible: false, mode: 'hidden' };
            }
            return { tutorialStep: next };
        });
    },
    triggerHammerPrank: () => {
        // 1. Maxluqot paydo bo'ladi
        set({ mode: 'prank_hammer', isVisible: true });
        // 2. 1.5 soniyadan keyin zarba beradi (Level o'zgaradi)
        setTimeout(() => {
            set({
                isPrankingLevel: true,
                prankMessage: "Haaa... Qo'rqib ketdingmi? Delta darajasida qanday ekan o'zini o'ta aqlli deb bilgan odamzot?!"
            });
            // 3. 6 soniyadan keyin hammasi o'z holiga qaytadi
            setTimeout(() => {
                get().endPrank();
            }, 6000);
        }, 1500);
    },
    triggerMatrixHack: () => {
        set({ mode: 'prank_matrix', isMatrixMode: true, isVisible: true, prankMessage: "Qiziq... Tizimni qanday aldayapsan? Sen oddiy odamga o'xshamaysan." });
        setTimeout(() => {
            get().endPrank();
        }, 4000);
    },
    triggerScreenWipe: () => {
        set({ mode: 'prank_wipe', isScreenWiped: true, isVisible: true, prankMessage: "Uxlab qoldingmi? Vaqt ketyapti, turg'izib yuboraymi?!" });
        setTimeout(() => {
            get().endPrank();
        }, 4000);
    },
    triggerThiefPrank: () => {
        set({ mode: 'prank_thief', isThiefActive: true, isVisible: true, prankMessage: "Oldingi xatolaringni ko'rib chiqmading-ku?! Avval xatoing ustida ishla, keyin test yechasan!" });
        setTimeout(() => {
            get().endPrank();
        }, 5000);
    },
    endPrank: () => {
        set({
            isPrankingLevel: false,
            isMatrixMode: false,
            isScreenWiped: false,
            isThiefActive: false,
            prankMessage: '',
            mode: 'hidden',
            isVisible: false
        });
    }
}));
