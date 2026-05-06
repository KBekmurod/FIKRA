const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
const PDFDocument = require('pdfkit')
const sharp = require('sharp')
const { logger } = require('../utils/logger')

const STORAGE_ROOT = path.join(__dirname, '..', '..', 'storage', 'certificates')
const PUBLIC_CERT_PREFIX = '/api/exams/sessions'

function safeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeFileName(value) {
  return String(value || 'certificate')
    .toLowerCase()
    .replace(/[^a-z0-9а-яёғқҳў\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'certificate'
}

function shortDate(date = new Date()) {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function scoreLabel(percent) {
  if (percent >= 90) return 'Alo daraja'
  if (percent >= 75) return 'Juda yaxshi'
  if (percent >= 60) return 'Yaxshi'
  if (percent >= 45) return 'Barqaror'
  return 'Boshlovchi'
}

function getDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return fullName || user?.username || user?.phone || 'Foydalanuvchi'
}

function buildMandateData({ user, session, result }) {
  const percent = result.maxTotalScore > 0 ? Math.round((result.totalScore / result.maxTotalScore) * 100) : 0
  const baseId = String(session._id || crypto.randomBytes(6).toString('hex'))
  const certificateNumber = `FIKRA-${new Date().getFullYear()}-${baseId.slice(-8).toUpperCase()}`
  const title = session.mode === 'drill' ? 'AI Drill Mandati' : 'DTM Natija Sertifikati'
  const subtitle = session.mode === 'drill'
    ? 'Zaif joylar asosida individual mashq natijasi'
    : 'Imtihon yakuni bo‘yicha rasmiy natija'

  return {
    certificateNumber,
    title,
    subtitle,
    fullName: getDisplayName(user),
    username: user?.username ? `@${user.username}` : '',
    modeLabel: session.mode === 'drill' ? 'Dynamic Weakness Drill' : (session.mode === 'dtm' ? 'DTM' : 'Subject Test'),
    scoreText: `${Number(result.totalScore).toFixed(1)} / ${Number(result.maxTotalScore).toFixed(1)}`,
    percent,
    rating: scoreLabel(percent),
    dateText: shortDate(new Date(result.endTime || session.endTime || Date.now())),
    issuedAt: new Date(),
    sessionId: String(session._id),
    summaryLine: session.mode === 'drill'
      ? 'Shaxsiy tahlil asosida tuzilgan, xatolarga yo‘naltirilgan mashq.'
      : 'Test natijasi asosida avtomatik yaratilgan sertifikat.',
  }
}

function buildSvg(data) {
  const name = safeText(data.fullName)
  const title = safeText(data.title)
  const subtitle = safeText(data.subtitle)
  const score = safeText(data.scoreText)
  const rating = safeText(data.rating)
  const modeLabel = safeText(data.modeLabel)
  const number = safeText(data.certificateNumber)
  const dateText = safeText(data.dateText)
  const summary = safeText(data.summaryLine)
  const username = safeText(data.username)

  return `
  <svg width="1600" height="1131" viewBox="0 0 1600 1131" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="120" y1="90" x2="1500" y2="1035" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0B1021"/>
        <stop offset="0.55" stop-color="#11172D"/>
        <stop offset="1" stop-color="#0A0E1B"/>
      </linearGradient>
      <linearGradient id="accent" x1="220" y1="120" x2="1400" y2="980" gradientUnits="userSpaceOnUse">
        <stop stop-color="#7B68EE"/>
        <stop offset="0.5" stop-color="#00D4AA"/>
        <stop offset="1" stop-color="#FFCC44"/>
      </linearGradient>
      <linearGradient id="panel" x1="320" y1="250" x2="1280" y2="870" gradientUnits="userSpaceOnUse">
        <stop stop-color="rgba(255,255,255,0.08)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0.03)"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="24" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="1600" height="1131" rx="48" fill="url(#bg)"/>
    <rect x="56" y="56" width="1488" height="1019" rx="40" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>

    <circle cx="260" cy="190" r="110" fill="#7B68EE" fill-opacity="0.18" filter="url(#glow)"/>
    <circle cx="1340" cy="940" r="140" fill="#00D4AA" fill-opacity="0.12" filter="url(#glow)"/>
    <circle cx="1240" cy="160" r="76" fill="#FFCC44" fill-opacity="0.14" filter="url(#glow)"/>

    <rect x="120" y="120" width="1360" height="80" rx="24" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
    <text x="160" y="171" fill="#EEF1FF" font-family="Arial, sans-serif" font-size="34" font-weight="700">FIKRA</text>
    <text x="270" y="171" fill="#7B68EE" font-family="Arial, sans-serif" font-size="34" font-weight="700">CERTIFICATE</text>
    <text x="1410" y="171" text-anchor="end" fill="rgba(255,255,255,0.58)" font-family="Arial, sans-serif" font-size="18">${modeLabel}</text>

    <rect x="190" y="245" width="1220" height="640" rx="36" fill="url(#panel)" stroke="rgba(255,255,255,0.12)"/>
    <rect x="240" y="300" width="250" height="250" rx="34" fill="rgba(123,104,238,0.16)" stroke="rgba(123,104,238,0.32)"/>
    <circle cx="365" cy="425" r="78" fill="url(#accent)" opacity="0.9"/>
    <text x="365" y="437" text-anchor="middle" fill="#0B1021" font-family="Arial, sans-serif" font-size="72" font-weight="900">★</text>

    <text x="590" y="340" fill="rgba(255,255,255,0.70)" font-family="Arial, sans-serif" font-size="20" letter-spacing="2">${subtitle}</text>
    <text x="590" y="425" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="64" font-weight="800">${name}</text>
    ${username ? `<text x="590" y="475" fill="rgba(255,255,255,0.62)" font-family="Arial, sans-serif" font-size="26">${username}</text>` : ''}
    <text x="590" y="535" fill="rgba(255,255,255,0.58)" font-family="Arial, sans-serif" font-size="24">${summary}</text>

    <rect x="590" y="600" width="420" height="110" rx="24" fill="rgba(123,104,238,0.14)" stroke="rgba(123,104,238,0.22)"/>
    <text x="620" y="640" fill="rgba(255,255,255,0.62)" font-family="Arial, sans-serif" font-size="18">Natija</text>
    <text x="620" y="683" fill="#FFCC44" font-family="Arial, sans-serif" font-size="40" font-weight="900">${score}</text>

    <rect x="1040" y="600" width="280" height="110" rx="24" fill="rgba(0,212,170,0.14)" stroke="rgba(0,212,170,0.22)"/>
    <text x="1070" y="640" fill="rgba(255,255,255,0.62)" font-family="Arial, sans-serif" font-size="18">Baholash</text>
    <text x="1070" y="683" fill="#00D4AA" font-family="Arial, sans-serif" font-size="40" font-weight="900">${rating}</text>

    <rect x="590" y="735" width="730" height="92" rx="26" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.09)"/>
    <text x="620" y="775" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="18">Sertifikat raqami</text>
    <text x="620" y="812" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="28" font-weight="700">${number}</text>
    <text x="1320" y="812" text-anchor="end" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="22">${dateText}</text>

    <text x="235" y="972" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-size="18">FIKRA — abituriyentlar uchun AI-kouch platforma</text>
    <text x="1365" y="972" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-size="18">Verify / share ready</text>
  </svg>`
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true })
}

async function writePdf(filePath, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: data.title, Author: 'FIKRA' } })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    doc.rect(0, 0, 595.28, 841.89).fill('#0B1021')
    doc.save().lineWidth(1.2).strokeColor('#FFFFFF').strokeOpacity(0.12)
    doc.roundedRect(30, 30, 535.28, 781.89, 28).stroke()
    doc.restore()

    doc.save().fillColor('#7B68EE').fillOpacity(0.18).circle(125, 110, 54).fill().restore()
    doc.save().fillColor('#00D4AA').fillOpacity(0.12).circle(470, 720, 68).fill().restore()

    doc.fillColor('#EEF1FF').font('Helvetica-Bold').fontSize(18).text('FIKRA CERTIFICATE', 55, 58)
    doc.fillColor('#7B68EE').fontSize(18).text(' ', 0, 0)
    doc.font('Helvetica').fillColor('#FFFFFF').fillOpacity(0.58).fontSize(10).text(data.modeLabel, 470, 60, { align: 'right', width: 75 })

    doc.save().fillColor('#FFFFFF').fillOpacity(0.06).roundedRect(60, 110, 475, 510, 22).fill().restore()
    doc.save().lineWidth(1).strokeColor('#FFFFFF').strokeOpacity(0.10).roundedRect(60, 110, 475, 510, 22).stroke().restore()
    doc.save().fillColor('#7B68EE').fillOpacity(0.16).roundedRect(95, 170, 110, 110, 20).fill().restore()
    doc.save().lineWidth(1).strokeColor('#7B68EE').strokeOpacity(0.24).roundedRect(95, 170, 110, 110, 20).stroke().restore()
    doc.fillColor('#FFCC44').font('Helvetica-Bold').fontSize(52).text('★', 95, 198, { width: 110, align: 'center' })

    doc.fillColor('#FFFFFF').fillOpacity(0.70).font('Helvetica').fontSize(10).text(data.subtitle, 230, 170, { width: 300 })
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text(data.fullName, 230, 195, { width: 300 })
    if (data.username) {
      doc.fillColor('#FFFFFF').fillOpacity(0.6).font('Helvetica').fontSize(13).text(data.username, 230, 230, { width: 300 })
    }
    doc.fillColor('#FFFFFF').fillOpacity(0.55).font('Helvetica').fontSize(11).text(data.summaryLine, 230, 258, { width: 300 })

    doc.save().fillColor('#7B68EE').fillOpacity(0.14).roundedRect(85, 320, 190, 80, 18).fill().restore()
    doc.save().lineWidth(1).strokeColor('#7B68EE').strokeOpacity(0.20).roundedRect(85, 320, 190, 80, 18).stroke().restore()
    doc.fillColor('#FFFFFF').fillOpacity(0.65).font('Helvetica').fontSize(9).text('Natija', 100, 338)
    doc.fillColor('#FFCC44').font('Helvetica-Bold').fontSize(20).text(data.scoreText, 100, 360)

    doc.save().fillColor('#00D4AA').fillOpacity(0.14).roundedRect(285, 320, 220, 80, 18).fill().restore()
    doc.save().lineWidth(1).strokeColor('#00D4AA').strokeOpacity(0.20).roundedRect(285, 320, 220, 80, 18).stroke().restore()
    doc.fillColor('#FFFFFF').fillOpacity(0.65).font('Helvetica').fontSize(9).text('Baholash', 300, 338)
    doc.fillColor('#00D4AA').font('Helvetica-Bold').fontSize(18).text(data.rating, 300, 360)

    doc.save().fillColor('#FFFFFF').fillOpacity(0.06).roundedRect(85, 420, 420, 74, 18).fill().restore()
    doc.save().lineWidth(1).strokeColor('#FFFFFF').strokeOpacity(0.10).roundedRect(85, 420, 420, 74, 18).stroke().restore()
    doc.fillColor('#FFFFFF').fillOpacity(0.58).font('Helvetica').fontSize(9).text('Sertifikat raqami', 100, 438)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15).text(data.certificateNumber, 100, 458)
    doc.fillColor('#FFFFFF').fillOpacity(0.58).font('Helvetica').fontSize(11).text(data.dateText, 360, 452, { width: 120, align: 'right' })

    doc.fillColor('#FFFFFF').fillOpacity(0.42).font('Helvetica').fontSize(9).text('FIKRA — abituriyentlar uchun AI-kouch platforma', 60, 690, { width: 475, align: 'left' })
    doc.fillColor('#FFFFFF').fillOpacity(0.42).font('Helvetica').fontSize(9).text('Share ready', 60, 705, { width: 475, align: 'right' })

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

async function generateMandateArtifacts({ user, session, result }) {
  const data = buildMandateData({ user, session, result })
  const userDir = path.join(STORAGE_ROOT, String(user._id))
  const sessionDir = path.join(userDir, String(session._id))
  await ensureDir(sessionDir)

  const baseName = `${safeFileName(data.fullName)}-${String(session._id).slice(-8)}`
  const pngPath = path.join(sessionDir, `${baseName}.png`)
  const pdfPath = path.join(sessionDir, `${baseName}.pdf`)

  if (!fs.existsSync(pngPath)) {
    const svg = buildSvg(data)
    await sharp(Buffer.from(svg)).png().toFile(pngPath)
  }

  if (!fs.existsSync(pdfPath)) {
    await writePdf(pdfPath, data)
  }

  return {
    ...data,
    pngPath,
    pdfPath,
    pngUrl: `${PUBLIC_CERT_PREFIX}/${session._id}/certificate/png`,
    pdfUrl: `${PUBLIC_CERT_PREFIX}/${session._id}/certificate/pdf`,
  }
}

async function getMandateFilePath({ userId, sessionId, format }) {
  const sessionDir = path.join(STORAGE_ROOT, String(userId), String(sessionId))
  const files = await fsp.readdir(sessionDir).catch(() => [])
  const ext = format === 'png' ? '.png' : '.pdf'
  const file = files.find(name => name.endsWith(ext))
  return file ? path.join(sessionDir, file) : null
}

module.exports = {
  generateMandateArtifacts,
  getMandateFilePath,
  buildMandateData,
}
