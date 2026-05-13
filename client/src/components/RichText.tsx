import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
// mhchem plugini KaTeX'ga qo'shadi (kimyo reaksiyalari uchun $\ce{...}$)
import 'katex/dist/contrib/mhchem.js'

/**
 * Rich text renderer:
 *   - Plain text fallback
 *   - LaTeX inline: $...$
 *   - LaTeX display: $$...$$
 *   - Kimyo (mhchem): $\ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}$
 *
 * Foydalanish:
 *   <RichText content="Maydonni toping: $S = \pi r^2$" />
 *   <RichText content="..." images={["url1.png", "url2.jpg"]} />
 */
interface Props {
  content: string
  images?: string[]
  className?: string
  inline?: boolean  // Bitta inline qatorda (savol matni uchun)
}

// Matnni LaTeX tokenlariga ajratish
type Token =
  | { type: 'text';        value: string }
  | { type: 'inline_math'; value: string }
  | { type: 'block_math';  value: string }

function tokenize(text: string): Token[] {
  if (!text) return []
  const tokens: Token[] = []

  // Avval $$...$$ (block) keyin $...$ (inline) ni topamiz
  // Regex: $$...$$ yoki $...$  (escape qilingan \$ ni e'tiborga olmaymiz)
  const re = /(\$\$([\s\S]+?)\$\$)|(\$([^\$\n]+?)\$)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    if (match[1]) {
      tokens.push({ type: 'block_math', value: match[2] })
    } else if (match[3]) {
      tokens.push({ type: 'inline_math', value: match[4] })
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return tokens
}

export default function RichText({ content, images, className, inline }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const mathElements = containerRef.current.querySelectorAll('[data-math]')
    mathElements.forEach(el => {
      const tex = el.getAttribute('data-math') || ''
      const isBlock = el.getAttribute('data-block') === '1'
      try {
        katex.render(tex, el as HTMLElement, {
          throwOnError: false,
          displayMode: isBlock,
          output: 'html',
          trust: true,
          strict: false,
        })
      } catch (e) {
        // Xato bo'lsa, oddiy matn sifatida ko'rsatish
        el.textContent = `$${tex}$`
      }
    })
  }, [content])

  const tokens = tokenize(content || '')
  const Container = inline ? 'span' : 'div'

  return (
    <Container ref={containerRef as any} className={`rich-text ${className || ''}`}>
      {tokens.map((tok, i) => {
        if (tok.type === 'text') {
          // Yangi qatorlarni saqlash
          return <span key={i}>{tok.value}</span>
        }
        if (tok.type === 'inline_math') {
          return (
            <span
              key={i}
              data-math={tok.value}
              data-block="0"
              className="math-inline"
            />
          )
        }
        if (tok.type === 'block_math') {
          return (
            <div
              key={i}
              data-math={tok.value}
              data-block="1"
              className="math-block"
            />
          )
        }
        return null
      })}

      {/* Savolga ulangan rasmlar (JPG/PNG) */}
      {images && images.length > 0 && (
        <div className="rich-text-images">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`rasm-${i + 1}`}
              className="rich-text-img"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </Container>
  )
}
