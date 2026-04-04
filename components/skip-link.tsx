'use client'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onFocus={(e) => {
        e.currentTarget.classList.add('skip-link-visible')
      }}
      onBlur={(e) => {
        e.currentTarget.classList.remove('skip-link-visible')
      }}
    >
      Pular para o conteúdo
    </a>
  )
}
