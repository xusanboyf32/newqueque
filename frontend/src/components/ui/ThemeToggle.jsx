import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ size = 'md' }) {
  const { theme, toggle, isDark } = useTheme()

  const s = size === 'sm'
    ? { btn: 48, track: 36, trackH: 20, dot: 14, icon: 13 }
    : { btn: 56, track: 44, trackH: 24, dot: 18, icon: 15 }

  return (
    <>
      <style>{`
        .theme-toggle-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          padding: 6px 0;
          color: var(--text-secondary);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          transition: color 0.2s;
          width: 100%;
        }
        .theme-toggle-btn:hover { color: var(--text-primary); }

        .tt-label { flex: 1; text-align: left; }

        .tt-track {
          border-radius: 100px;
          background: var(--border);
          position: relative;
          flex-shrink: 0;
          transition: background 0.35s;
          overflow: hidden;
        }
        .tt-track.light-on { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
        .tt-track.dark-on  { background: linear-gradient(135deg, #3b4fd8, #5282ff); }

        .tt-dot {
          position: absolute;
          top: 50%;
          transform: translateY(-50%) translateX(3px);
          background: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 1px 6px rgba(0,0,0,0.25);
          font-size: 0;
          overflow: hidden;
        }
        .tt-dot.moved { transform: translateY(-50%) translateX(calc(100% - 3px)); }

        /* Sun rays animation */
        .tt-sun-ray {
          position: absolute;
          width: 2px; height: 4px;
          background: #fbbf24;
          border-radius: 1px;
          transition: opacity 0.3s;
        }

        /* Stars for dark mode icon */
        .tt-icon-wrap {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: inherit;
          transition: opacity 0.3s, transform 0.3s;
          line-height: 1;
        }
      `}</style>

      <button className="theme-toggle-btn" onClick={toggle} type="button">
        <span className="tt-label">
          {isDark ? '🌙 Tun rejimi' : '☀️ Kun rejimi'}
        </span>

        <div
          className={`tt-track ${isDark ? 'dark-on' : 'light-on'}`}
          style={{ width: s.track, height: s.trackH }}
        >
          <div
            className={`tt-dot${isDark ? ' moved' : ''}`}
            style={{ width: s.dot, height: s.dot }}
          >
            <span className="tt-icon-wrap" style={{ fontSize: s.icon }}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </div>
        </div>
      </button>
    </>
  )
}