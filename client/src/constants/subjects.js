// Frontend SUBJECT_META — backend examService.js bilan moslashtirilgan
// To'liq DTM fanlari ro'yxati (18 ta fan)
export var SUBJECTS = {
    // Majburiy fanlar (3)
    uztil: { id: 'uztil', name: 'Ona tili', icon: '📖', block: 'majburiy', weight: 1.1 },
    math: { id: 'math', name: 'Matematika', icon: '🔢', block: 'majburiy', weight: 1.1 },
    tarix: { id: 'tarix', name: "O'zbekiston tarixi", icon: '🏛', block: 'majburiy', weight: 1.1 },
    // Aniq va tabiiy fanlar
    fizika: { id: 'fizika', name: 'Fizika', icon: '⚛', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
    kimyo: { id: 'kimyo', name: 'Kimyo', icon: '⚗', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 2.1 },
    bio: { id: 'bio', name: 'Biologiya', icon: '🧬', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
    geo: { id: 'geo', name: 'Geografiya', icon: '🌍', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
    // Gumanitar fanlar
    adab: { id: 'adab', name: 'Ona tili va adabiyoti', icon: '📚', block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },
    huquq: { id: 'huquq', name: 'Davlat va huquq', icon: '⚖', block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },
    // Chet tillari
    ingliz: { id: 'ingliz', name: 'Ingliz tili', icon: '🇬🇧', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    nemis: { id: 'nemis', name: 'Nemis tili', icon: '🇩🇪', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    fransuz: { id: 'fransuz', name: 'Fransuz tili', icon: '🇫🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    arab: { id: 'arab', name: 'Arab tili', icon: '🕌', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    fors: { id: 'fors', name: 'Fors tili', icon: '🌙', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    turk: { id: 'turk', name: 'Turk tili', icon: '🇹🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
    // Boshqalar (DTM da bor)
    rus: { id: 'rus', name: 'Rus tili', icon: '🇷🇺', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 },
    inform: { id: 'inform', name: 'Informatika', icon: '💻', block: 'mutaxassislik', category: 'boshqa', weight: 3.1 },
    iqtisod: { id: 'iqtisod', name: 'Iqtisodiyot', icon: '📊', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 }
};
export var COMPULSORY_IDS = ['uztil', 'math', 'tarix'];
export var SPEC_IDS = [
    // Aniq va tabiiy
    'fizika', 'kimyo', 'bio', 'geo',
    // Gumanitar
    'adab', 'huquq',
    // Chet tillari
    'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
    // Boshqalar
    'rus', 'inform', 'iqtisod',
    // Math va tarix mutaxassislikda ham bo'ladi (dual context)
    'math', 'tarix',
];
// Dual-context fanlar (majburiy va mutaxassislik ikkalasida bo'la oladi)
export var DUAL_CONTEXT_SUBJECTS = new Set(['math', 'tarix']);
// Faqat majburiy
export var ONLY_COMPULSORY_SUBJECTS = new Set(['uztil']);
// Faqat mutaxassislik
export var ONLY_SPECIALTY_SUBJECTS = new Set([
    'fizika', 'kimyo', 'bio', 'geo',
    'adab', 'huquq',
    'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
    'rus', 'inform', 'iqtisod',
]);
export function getAllowedContexts(subjectId) {
    if (DUAL_CONTEXT_SUBJECTS.has(subjectId))
        return ['majburiy', 'mutaxassislik'];
    if (ONLY_COMPULSORY_SUBJECTS.has(subjectId))
        return ['majburiy'];
    return ['mutaxassislik'];
}
export function getStandardCountByContext(context) {
    return context === 'majburiy' ? 10 : 30;
}
// Mutaxassislik fanlarini kategoriya bo'yicha guruhlash
export var SPEC_BY_CATEGORY = {
    aniq_tabiiy: ['fizika', 'kimyo', 'bio', 'geo'],
    gumanitar: ['adab', 'huquq'],
    chet_tili: ['ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk'],
    boshqa: ['rus', 'inform', 'iqtisod']
};
export var SPEC_CATEGORY_NAMES = {
    aniq_tabiiy: 'Aniq va tabiiy fanlar',
    gumanitar: 'Gumanitar fanlar',
    chet_tili: 'Chet tillari',
    boshqa: 'Boshqalar'
};
export function getSubject(id) {
    return SUBJECTS[id] || null;
}
// Standart test sonlari
// Majburiy fan papkasi: 10 ta
// Mutaxassislik fan papkasi: 30 ta
export function getStandardTestCount(subjectId) {
    var subj = getSubject(subjectId);
    if (!subj)
        return 10;
    return subj.block === 'majburiy' ? 10 : 30;
}
// Material yetarliligi - har test uchun taxminan 500 belgi
export function getMinCharsRequired(subjectId) {
    return getStandardTestCount(subjectId) * 500;
}
// Plan badge'lari
export var PLAN_BADGES = {
    free: { name: 'Free', color: '#9ca3af', icon: '🆓' },
    basic: { name: 'Basic', color: '#3b82f6', icon: '⭐' },
    pro: { name: 'Pro', color: '#a855f7', icon: '💎' },
    vip: { name: 'VIP', color: '#fbbf24', icon: '👑' }
};
// Daraja rang/icon — Delta (v1-3) → Beta (v4-7) → Alfa (v8-10)
export var GRADE_META = {
    delta: { name: 'Delta', icon: 'δ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
    beta: { name: 'Beta', icon: 'β', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
    alfa: { name: 'Alfa', icon: 'α', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' }
};
export function versionToGrade(version) {
    if (version <= 3)
        return 'delta';
    if (version <= 7)
        return 'beta';
    return 'alfa';
}
export function versionInGrade(version) {
    var grade = versionToGrade(version);
    var offset = grade === 'delta' ? 0 : grade === 'beta' ? 3 : 7;
    return version - offset;
}
export function formatChars(n) {
    if (n < 1000)
        return String(n);
    return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K';
}
export function formatBytes(kb) {
    if (kb < 1024)
        return kb + " KB";
    return (kb / 1024).toFixed(1) + " MB";
}
