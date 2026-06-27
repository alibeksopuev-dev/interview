import { FC } from 'react'

interface CodeBlockProps {
  code: string
  /** Подпись над блоком, напр. "Было" / "Стало" */
  label?: string
  variant?: 'broken' | 'fixed' | 'neutral'
}

/**
 * Минималистичная подсветка ключевых слов TS/JSX без внешних зависимостей.
 * Достаточно для тренажёра — не претендует на полноценный токенайзер.
 */
const KEYWORDS = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'interface', 'type', 'import', 'from', 'export', 'default', 'new', 'throw',
  'extends', 'typeof', 'as', 'void', 'null', 'undefined', 'true', 'false',
]

function highlight(line: string): JSX.Element[] {
  // комментарий целиком
  const commentIdx = line.indexOf('//')
  if (commentIdx !== -1) {
    return [
      ...highlight(line.slice(0, commentIdx)),
      <span key="cmt" className='rf-tok-comment'>{line.slice(commentIdx)}</span>,
    ]
  }

  const parts = line.split(/(\b\w+\b|'[^']*'|`[^`]*`|"[^"]*")/g)
  return parts.map((part, i) => {
    if (KEYWORDS.includes(part)) {
      return <span key={i} className='rf-tok-kw'>{part}</span>
    }
    if (/^['"`].*['"`]$/.test(part)) {
      return <span key={i} className='rf-tok-str'>{part}</span>
    }
    if (/^use[A-Z]\w*$/.test(part) || /^set[A-Z]\w*$/.test(part)) {
      return <span key={i} className='rf-tok-hook'>{part}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export const CodeBlock: FC<CodeBlockProps> = ({ code, label, variant = 'neutral' }) => {
  return (
    <div className={`rf-code rf-code-${variant}`}>
      {label && <div className='rf-code-label'>{label}</div>}
      <pre className='rf-code-pre'>
        <code>
          {code.split('\n').map((line, i) => (
            <div key={i} className='rf-code-line'>
              <span className='rf-code-ln'>{i + 1}</span>
              <span className='rf-code-content'>{highlight(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
