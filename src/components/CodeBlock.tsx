'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodeBlockProps {
  code: string
  language: 'json' | 'bash' | 'typescript'
  label?: string
}

// ---------------------------------------------------------------------------
// Syntax highlighting — pure string tokenization, no external library
// ---------------------------------------------------------------------------

type Token = { text: string; color: string }

// JSON highlighter: keys in copper, strings in green, numbers in blue,
// booleans/null in amber
function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = []
  // Regex: key-value pairs, strings, numbers, booleans, punctuation
  const re = /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])|(\s+)|(\/\/[^\n]*)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(code)) !== null) {
    if (m.index > last) {
      tokens.push({ text: code.slice(last, m.index), color: '#cdd6f4' })
    }

    const [full, keyColon, str, bool, num, punct, ws, comment] = m

    if (keyColon) {
      // Split key from colon
      const colonIdx = full.lastIndexOf(':')
      tokens.push({ text: full.slice(0, colonIdx), color: '#b8734a' }) // copper key
      tokens.push({ text: ':', color: '#6b6560' })
    } else if (str) {
      tokens.push({ text: full, color: '#2d5a27' }) // green string
    } else if (bool) {
      tokens.push({ text: full, color: '#d4a44c' }) // amber bool/null
    } else if (num) {
      tokens.push({ text: full, color: '#7ab8f5' }) // blue number
    } else if (punct) {
      tokens.push({ text: full, color: '#6b6560' })
    } else if (ws) {
      tokens.push({ text: full, color: 'transparent' })
    } else if (comment) {
      tokens.push({ text: full, color: '#6b6560' })
    } else {
      tokens.push({ text: full, color: '#cdd6f4' })
    }

    last = re.lastIndex
  }

  if (last < code.length) {
    tokens.push({ text: code.slice(last), color: '#cdd6f4' })
  }

  return tokens
}

// Bash highlighter: commands in white, flags in copper, strings in green,
// comments in muted
function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = []
  const lines = code.split('\n')

  lines.forEach((line, li) => {
    if (li > 0) tokens.push({ text: '\n', color: 'transparent' })

    const trimmed = line.trimStart()
    if (trimmed.startsWith('#')) {
      tokens.push({ text: line, color: '#6b6560' })
      return
    }

    // Tokenize within line
    const re = /(-{1,2}[\w-]+=?)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(https?:\/\/\S+)|(\S+)|(\s+)/g
    let m: RegExpExecArray | null
    let isFirstWord = true

    while ((m = re.exec(line)) !== null) {
      const [full, flag, dqStr, sqStr, url] = m

      if (/^\s+$/.test(full)) {
        tokens.push({ text: full, color: 'transparent' })
      } else if (flag) {
        tokens.push({ text: full, color: '#b8734a' })
        isFirstWord = false
      } else if (dqStr || sqStr) {
        tokens.push({ text: full, color: '#2d5a27' })
        isFirstWord = false
      } else if (url) {
        tokens.push({ text: full, color: '#7ab8f5' })
        isFirstWord = false
      } else if (isFirstWord) {
        tokens.push({ text: full, color: '#ffffff' })
        isFirstWord = false
      } else {
        tokens.push({ text: full, color: '#cdd6f4' })
      }
    }
  })

  return tokens
}

// TypeScript highlighter: keywords in amber, strings in green, types in blue,
// comments in muted
function tokenizeTypescript(code: string): Token[] {
  const tokens: Token[] = []
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'async', 'await', 'return',
    'interface', 'type', 'export', 'import', 'from', 'default', 'class',
    'extends', 'implements', 'new', 'if', 'else', 'for', 'while', 'try',
    'catch', 'throw', 'true', 'false', 'null', 'undefined', 'void',
  ])

  const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(:\s*\w[\w<>[\]|&,\s]*)|(0x[\da-fA-F]+|\d+(?:\.\d+)?)|([\w$]+)|([^\w\s$])|(\s+)/g
  let m: RegExpExecArray | null
  let last = 0

  while ((m = re.exec(code)) !== null) {
    if (m.index > last) {
      tokens.push({ text: code.slice(last, m.index), color: '#cdd6f4' })
    }

    const [full, lineComment, blockComment, str, typeAnnotation, num, word, punct, ws] = m

    if (lineComment || blockComment) {
      tokens.push({ text: full, color: '#6b6560' })
    } else if (str) {
      tokens.push({ text: full, color: '#2d5a27' })
    } else if (typeAnnotation) {
      tokens.push({ text: full, color: '#7ab8f5' })
    } else if (num) {
      tokens.push({ text: full, color: '#7ab8f5' })
    } else if (word) {
      tokens.push({ text: full, color: keywords.has(full) ? '#d4a44c' : '#cdd6f4' })
    } else if (punct) {
      tokens.push({ text: full, color: '#6b6560' })
    } else if (ws) {
      tokens.push({ text: full, color: 'transparent' })
    } else {
      tokens.push({ text: full, color: '#cdd6f4' })
    }

    last = re.lastIndex
  }

  if (last < code.length) {
    tokens.push({ text: code.slice(last), color: '#cdd6f4' })
  }

  return tokens
}

function tokenize(code: string, language: 'json' | 'bash' | 'typescript'): Token[] {
  if (language === 'json') return tokenizeJson(code)
  if (language === 'bash') return tokenizeBash(code)
  return tokenizeTypescript(code)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CodeBlock({ code, language, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const tokens = tokenize(code, language)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#0f0e0d',
        border: '1px solid #2a2826',
        fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", Menlo, monospace',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ backgroundColor: '#1a1714', borderColor: '#2a2826' }}
      >
        <span className="text-xs font-medium" style={{ color: '#6b6560' }}>
          {label ?? language}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded-md transition-all"
          style={{
            backgroundColor: copied ? '#1a2e1a' : '#2a2826',
            color: copied ? '#4caf70' : '#6b6560',
            border: `1px solid ${copied ? '#2d5a27' : '#3a3836'}`,
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre
        className="p-4 overflow-x-auto text-xs leading-relaxed m-0"
        style={{ backgroundColor: 'transparent' }}
      >
        <code>
          {tokens.map((tok, i) => (
            <span key={i} style={{ color: tok.color }}>
              {tok.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
