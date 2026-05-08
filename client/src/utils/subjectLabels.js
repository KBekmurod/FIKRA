// DTM 2026 — Fan ID lari va ularning rasmiy nomlari
// Bu map har qanday joyda subject ID → o'zbek tilida rasmiy nom uchun ishlatiladi
export const SUBJECT_LABELS = {
    uztil: "Ona tili va adabiyot",
    math: "Matematika",
    tarix: "O'zbekiston tarixi",
    bio: "Biologiya",
    kimyo: "Kimyo",
    fizika: "Fizika",
    ingliz: "Ingliz tili",
    rus: "Rus tili",
    inform: "Informatika",
    iqtisod: "Iqtisodiyot",
    geo: "Geografiya",
    adab: "O'zbek adabiyoti",
};
/**
 * Subject ID ga mos rasmiy nomni qaytaradi.
 * Noma'lum ID bo'lsa, ID ning o'zini qaytaradi.
 */
export function getSubjectLabel(subjectId) {
    return SUBJECT_LABELS[subjectId] ?? subjectId;
}
/**
 * Savolning fan nomini aniqlaydi — serverdan kelgan subjectName
 * ustunlik qiladi, aks holda SUBJECT_LABELS dan olinadi.
 */
export function resolveSubjectName(subjectId, serverSubjectName) {
    if (serverSubjectName && serverSubjectName.trim() && serverSubjectName !== subjectId) {
        return serverSubjectName;
    }
    if (subjectId)
        return getSubjectLabel(subjectId);
    return '';
}
