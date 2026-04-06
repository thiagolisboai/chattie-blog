/**
 * BlogHeroSymbols — floating brand symbol cluster for the blog hero right column.
 * Built from the Chattie brand symbol sheet (hand-drawn style, flat fills, bold outlines).
 * Pure server component — no client JS needed. CSS animations only.
 */

export function BlogHeroSymbols() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        height: 300,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* ── Small 4-point sparkle — top left ─────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: '8%', width: 34, height: 34, transform: 'rotate(-18deg)' }}>
        <div className="sf4">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50,0 L56,43 L100,50 L56,57 L50,100 L44,57 L0,50 L44,43 Z"
              stroke="#000" strokeWidth="5" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Lavender flower star — top center ────────────────────────── */}
      <div style={{ position: 'absolute', top: 4, left: '38%', width: 54, height: 54, transform: 'rotate(15deg)' }}>
        <div className="sf3">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(50,50)">
              <ellipse cx="0" cy="-26" rx="11" ry="24" fill="#E4C1F9" stroke="#000" strokeWidth="2.5" />
              <ellipse cx="0" cy="-26" rx="11" ry="24" fill="#E4C1F9" stroke="#000" strokeWidth="2.5" transform="rotate(45)" />
              <ellipse cx="0" cy="-26" rx="11" ry="24" fill="#E4C1F9" stroke="#000" strokeWidth="2.5" transform="rotate(90)" />
              <ellipse cx="0" cy="-26" rx="11" ry="24" fill="#E4C1F9" stroke="#000" strokeWidth="2.5" transform="rotate(135)" />
              <circle cx="0" cy="0" r="13" fill="#E4C1F9" stroke="#000" strokeWidth="2.5" />
            </g>
          </svg>
        </div>
      </div>

      {/* ── Large spiky 8-point starburst — top right ────────────────── */}
      <div style={{ position: 'absolute', top: -6, right: '4%', width: 80, height: 80, transform: 'rotate(8deg)' }}>
        <div className="sf1">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100,50 L63.9,44.3 L85.4,14.6 L55.7,36.1 L50,0 L44.3,36.1 L14.6,14.6 L36.1,44.3 L0,50 L36.1,55.7 L14.6,85.4 L44.3,63.9 L50,100 L55.7,63.9 L85.4,85.4 L63.9,55.7 Z"
              stroke="#000" strokeWidth="3.5" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Chat bubble — center hero, main brand symbol ──────────────── */}
      <div style={{ position: 'absolute', top: 90, left: '2%', width: 112, height: 90, transform: 'rotate(-4deg)' }}>
        <div className="sf2">
          <svg viewBox="0 0 112 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bubble body */}
            <path
              d="M10,0 Q0,0 0,10 L0,58 Q0,68 10,68 L38,68 L48,90 L48,68 L102,68 Q112,68 112,58 L112,10 Q112,0 102,0 Z"
              fill="#C8C8C8" stroke="#000" strokeWidth="3" strokeLinejoin="round"
            />
            {/* Three dots */}
            <circle cx="33" cy="34" r="7" fill="#000" />
            <circle cx="56" cy="34" r="7" fill="#000" />
            <circle cx="79" cy="34" r="7" fill="#000" />
          </svg>
        </div>
      </div>

      {/* ── Gold smiley star — right center ───────────────────────────── */}
      <div style={{ position: 'absolute', top: 82, right: '5%', width: 66, height: 66, transform: 'rotate(-10deg)' }}>
        <div className="sf5">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50,4 L60.6,35.4 L93.7,63.4 L67.1,55.6 L64.6,96.6 L50,68 L35.4,96.6 L32.9,55.6 L6.3,63.4 L39.4,35.4 Z"
              fill="#F4B13F" stroke="#000" strokeWidth="3" strokeLinejoin="round"
            />
            {/* Eyes */}
            <circle cx="38" cy="43" r="4" fill="#000" />
            <circle cx="62" cy="43" r="4" fill="#000" />
            {/* Smile */}
            <path d="M35,58 Q50,70 65,58" stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* ── Lightbulb — bottom left ───────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 8, left: '18%', width: 46, height: 60, transform: 'rotate(7deg)' }}>
        <div className="sf6">
          <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bulb glass */}
            <path
              d="M26,75 L26,62 C15,55 8,44 8,30 C8,14 22,2 40,2 C58,2 72,14 72,30 C72,44 65,55 54,62 L54,75 Z"
              fill="#FAFBF3" stroke="#000" strokeWidth="3" strokeLinejoin="round"
            />
            {/* Base stripes */}
            <line x1="26" y1="75" x2="54" y2="75" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="28" y1="83" x2="52" y2="83" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="31" y1="91" x2="49" y2="91" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Face inside */}
            <circle cx="30" cy="36" r="4" fill="#000" />
            <circle cx="50" cy="36" r="4" fill="#000" />
            <path d="M28,52 Q40,62 52,52" stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* ── Small 4-point sparkle — bottom right ──────────────────────── */}
      <div style={{ position: 'absolute', bottom: 18, right: '16%', width: 28, height: 28, transform: 'rotate(22deg)' }}>
        <div className="sf7">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50,0 L56,43 L100,50 L56,57 L50,100 L44,57 L0,50 L44,43 Z"
              stroke="#000" strokeWidth="6" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Teal checkbox — mid right ─────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 175, right: '2%', width: 52, height: 40, transform: 'rotate(5deg)' }}>
        <div className="sf3">
          <svg viewBox="0 0 90 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="84" height="62" rx="6" fill="#66BAC6" stroke="#000" strokeWidth="3" />
            <polyline points="20,36 36,52 70,18" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  )
}
