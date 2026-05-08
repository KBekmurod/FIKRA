const CONFIG_KEY = 'fikra_exam_config_v1';
const BANK_KEY = 'fikra_offline_question_bank_v1';
function safeParse(raw, fallback) {
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function getBank() {
    return safeParse(localStorage.getItem(BANK_KEY), {});
}
function setBank(bank) {
    localStorage.setItem(BANK_KEY, JSON.stringify(bank));
}
export function getCachedExamConfig() {
    return safeParse(localStorage.getItem(CONFIG_KEY), null);
}
export function saveCachedExamConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
export function saveOfflinePack(subject, block, questions) {
    const bank = getBank();
    const key = `${subject}__${block}`;
    const merged = [...(bank[key] || []), ...questions]
        .filter((item, index, array) => array.findIndex(q => q._id === item._id) === index)
        .slice(0, 60);
    bank[key] = merged;
    setBank(bank);
}
function pickQuestions(subject, block, count) {
    const bank = getBank();
    const key = `${subject}__${block}`;
    const list = [...(bank[key] || [])];
    if (!list.length)
        return [];
    const shuffled = list.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}
function buildSubjectBreakdown(entries) {
    return entries.map(entry => ({
        subjectId: entry.id,
        subjectName: entry.name,
        block: entry.block,
        weight: entry.weight,
        questionCount: entry.count,
        correct: 0,
        wrong: 0,
        score: 0,
        maxScore: Number((entry.count * entry.weight).toFixed(1)),
    }));
}
function buildDuration(totalQuestions, mode) {
    if (mode === 'dtm')
        return 180 * 60;
    return Math.max(15 * 60, totalQuestions * 90);
}
export async function warmOfflineQuestionBank(config, fetchPack) {
    const tasks = config.subjects.map(async (subject) => {
        const block = subject.block;
        const questions = await fetchPack(subject.id, block, 40);
        saveOfflinePack(subject.id, block, questions);
    });
    await Promise.allSettled(tasks);
}
export function buildOfflineDtmSession(config, directionId) {
    const direction = config.directions.find(item => item.id === directionId);
    if (!direction)
        return null;
    const subjectMeta = new Map(config.subjects.map(item => [item.id, item]));
    const entries = [
        { id: 'uztil', weight: 1.1, count: 10, block: 'majburiy' },
        { id: 'math', weight: 1.1, count: 10, block: 'majburiy' },
        { id: 'tarix', weight: 1.1, count: 10, block: 'majburiy' },
        { id: direction.spec1, weight: subjectMeta.get(direction.spec1)?.weight ?? 3.1, count: 30, block: 'mutaxassislik' },
        { id: direction.spec2, weight: subjectMeta.get(direction.spec2)?.weight ?? 2.1, count: 30, block: 'mutaxassislik' },
    ];
    const questions = [];
    const breakdown = buildSubjectBreakdown(entries.map(entry => ({
        id: entry.id,
        name: subjectMeta.get(entry.id)?.name || entry.id,
        block: entry.block,
        weight: entry.weight,
        count: entry.count,
    })));
    for (const entry of entries) {
        const block = entry.block === 'majburiy' ? 'majburiy' : 'mutaxassislik';
        const picked = pickQuestions(entry.id, block, entry.count);
        questions.push(...picked);
    }
    if (!questions.length)
        return null;
    return {
        sessionId: `offline-${Date.now()}`,
        mode: 'dtm',
        direction: directionId,
        directionName: direction.name,
        durationSeconds: buildDuration(questions.length, 'dtm'),
        subjectBreakdown: breakdown.map(item => ({ ...item })),
        questions,
        offline: true,
    };
}
export function buildOfflineSubjectSession(config, selectedSubjects, counts) {
    const subjectMeta = new Map(config.subjects.map(item => [item.id, item]));
    const entries = selectedSubjects
        .map(id => {
        const meta = subjectMeta.get(id);
        if (!meta)
            return null;
        const count = Math.max(1, Math.min(50, counts?.[id] ?? meta.defaultCount));
        return {
            id: meta.id,
            name: meta.name,
            block: meta.block,
            weight: meta.weight,
            count,
        };
    })
        .filter(Boolean);
    const questions = [];
    for (const entry of entries) {
        const picked = pickQuestions(entry.id, entry.block, entry.count);
        questions.push(...picked);
    }
    if (!questions.length)
        return null;
    return {
        sessionId: `offline-${Date.now()}`,
        mode: 'subject',
        durationSeconds: buildDuration(questions.length, 'subject'),
        subjectBreakdown: buildSubjectBreakdown(entries),
        questions,
        offline: true,
    };
}
export function calculateOfflineResult(session, answers) {
    const stats = session.subjectBreakdown.map(item => ({ ...item, correct: 0, wrong: 0, score: 0 }));
    const questionMap = new Map(session.questions.map(question => [question._id, question]));
    for (const [questionId, answer] of Object.entries(answers)) {
        const question = questionMap.get(questionId);
        if (!question)
            continue;
        const stat = stats.find(item => item.subjectId === question.subject);
        if (!stat)
            continue;
        if (answer.isCorrect) {
            stat.correct += 1;
            stat.score = Number((stat.score + stat.weight).toFixed(1));
        }
        else {
            stat.wrong += 1;
        }
    }
    const totalScore = stats.reduce((sum, item) => sum + item.score, 0);
    const maxTotalScore = stats.reduce((sum, item) => sum + item.maxScore, 0);
    const percent = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    return {
        sessionId: session.sessionId,
        mode: session.mode,
        totalScore: Number(totalScore.toFixed(1)),
        maxTotalScore: Number(maxTotalScore.toFixed(1)),
        percent,
        subjectBreakdown: stats,
        direction: session.direction,
        directionName: session.directionName,
        xp: null,
        offline: true,
    };
}
