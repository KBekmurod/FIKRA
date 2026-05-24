import { create } from 'zustand'

export type EntityMode = 'hidden' | 'dart' | 'observe' | 'converse' | 'prank_hammer' | 'prank_thief' | 'prank_wipe' | 'prank_matrix' | 'idle_logo'

interface EntityState {
  mode: EntityMode
  isVisible: boolean
  isPrankingLevel: boolean
  isMatrixMode: boolean
  isScreenWiped: boolean
  isThiefActive: boolean
  isPassingBy: boolean
  isSleepingOnLogo: boolean
  prankMessage: string
  
  // Tutorial
  tutorialStep: number // 0 = no tutorial, 1 = ombor, 2 = test, 3 = tarix
  
  // Actionlar
  setMode: (mode: EntityMode) => void
  setVisibility: (isVisible: boolean) => void
  setTutorialStep: (step: number) => void
  startTutorial: () => void
  nextTutorialStep: () => void
  
  // Prank & Animations
  triggerHammerPrank: (onComplete?: () => void) => void
  triggerMatrixHack: () => void
  triggerScreenWipe: () => void
  triggerThiefPrank: () => void
  triggerLogoSleep: () => void
  triggerPassByFast: () => void
  endPrank: () => void
  
  // SSE ulanish
  connectSSE: () => void
}

let activeEventSource: EventSource | null = null;

export const useEntityStore = create<EntityState>((set, get) => ({
  mode: 'hidden',
  isVisible: false,
  isPrankingLevel: false,
  isMatrixMode: false,
  isScreenWiped: false,
  isThiefActive: false,
  isPassingBy: false,
  isSleepingOnLogo: false,
  prankMessage: '',
  tutorialStep: 0,

  setMode: (mode) => set({ mode }),
  setVisibility: (isVisible) => set({ isVisible }),
  
  setTutorialStep: (step) => set({ tutorialStep: step, isVisible: step > 0 }),
  
  startTutorial: () => {
    set({ tutorialStep: 1, isVisible: true, mode: 'converse' })
  },
  
  nextTutorialStep: () => {
    set((state) => {
      const next = state.tutorialStep + 1
      if (next > 3) {
        return { tutorialStep: 0, isVisible: false, mode: 'hidden' }
      }
      return { tutorialStep: next }
    })
  },
  
  triggerHammerPrank: (onComplete) => {
    // 1. Maxluqot paydo bo'lib maqtab kuladi
    set({ mode: 'prank_hammer', isVisible: true, isPrankingLevel: false })
    setTimeout(() => {
      // 2. Bolg'a tushib level qizaradi
      set({ isPrankingLevel: true })
      setTimeout(() => {
        // 3. Uzr so'rab joyiga qaytaradi
        set({ isPrankingLevel: false, mode: 'hidden', isVisible: false })
        if (onComplete) onComplete()
      }, 5000)
    }, 3000)
  },

  triggerMatrixHack: () => {
    set({ mode: 'prank_matrix', isMatrixMode: true, isVisible: true, prankMessage: "Qiziq... Tizimni qanday aldayapsan? Sen oddiy odamga o'xshamaysan." })
    setTimeout(() => {
      get().endPrank()
    }, 4000)
  },

  triggerScreenWipe: () => {
    set({ mode: 'prank_wipe', isScreenWiped: true, isVisible: true, prankMessage: "Uxlab qoldingmi? Vaqt ketyapti, turg'izib yuboraymi?!" })
    setTimeout(() => {
      get().endPrank()
    }, 4000)
  },

  triggerThiefPrank: () => {
    set({ mode: 'prank_thief', isThiefActive: true, isVisible: true, prankMessage: "He-he-he, bu tugma endi meniki! Yaxshilab o'rganib chiqmaguningcha bermayman!" })
    setTimeout(() => {
      set({ isThiefActive: false, mode: 'hidden', isVisible: false })
    }, 4000)
  },

  triggerLogoSleep: () => {
    set({ mode: 'idle_logo', isSleepingOnLogo: true, isVisible: true, prankMessage: "Zzz... qachon chaqirsang oyg'onaman..." })
  },

  triggerPassByFast: () => {
    set({ isPassingBy: true, isVisible: true })
    setTimeout(() => {
      set({ isPassingBy: false, isVisible: false })
    }, 1500)
  },
  
  endPrank: () => {
    set({ 
      mode: 'hidden', 
      isVisible: false, 
      isMatrixMode: false, 
      isScreenWiped: false, 
      isThiefActive: false, 
      isPrankingLevel: false,
      isPassingBy: false,
      prankMessage: '' 
    })
  },

  connectSSE: () => {
    const token = localStorage.getItem('token')
    if (!token) return;
    
    // Agar oldindan ulanish bo'lsa uni yopamiz (Memory Leak oldini olish)
    if (activeEventSource) {
      activeEventSource.close();
    }
    
    const evtSource = new EventSource('/api/entity/stream');
    activeEventSource = evtSource;

    evtSource.addEventListener('global_prank', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'matrix') get().triggerMatrixHack()
        else if (data.type === 'wipe') get().triggerScreenWipe()
        else if (data.type === 'hammer') get().triggerHammerPrank()
        else if (data.type === 'message') {
           set({ prankMessage: data.message, mode: 'converse', isVisible: true })
           setTimeout(() => set({ prankMessage: '', mode: 'hidden', isVisible: false }), 8000)
        }
      } catch(err) {}
    });
  }
}))
