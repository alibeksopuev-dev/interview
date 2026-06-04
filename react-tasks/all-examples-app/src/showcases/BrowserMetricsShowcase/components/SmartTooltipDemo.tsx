import { useState } from 'react'

type TooltipPlacement =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'

export function SmartTooltipDemo() {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    placement: TooltipPlacement
    text: string
  }>({ visible: false, x: 0, y: 0, placement: 'top', text: '' })

  const showTooltip = (
    e: React.MouseEvent<HTMLButtonElement>,
    text: string,
    wantedPlacement: TooltipPlacement = 'top'
  ) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const TT_W = 220
    const TT_H = 60
    const GAP = 8

    const getCoords = (p: TooltipPlacement) => {
      let tx = rect.left + rect.width / 2 - TT_W / 2
      let ty = rect.top - TT_H - GAP

      if (p === 'top-left') {
        tx = rect.left
        ty = rect.top - TT_H - GAP
      } else if (p === 'top-right') {
        tx = rect.right - TT_W
        ty = rect.top - TT_H - GAP
      } else if (p === 'bottom') {
        tx = rect.left + rect.width / 2 - TT_W / 2
        ty = rect.bottom + GAP
      } else if (p === 'bottom-left') {
        tx = rect.left
        ty = rect.bottom + GAP
      } else if (p === 'bottom-right') {
        tx = rect.right - TT_W
        ty = rect.bottom + GAP
      } else if (p === 'left') {
        tx = rect.left - TT_W - GAP
        ty = rect.top + rect.height / 2 - TT_H / 2
      } else if (p === 'right') {
        tx = rect.right + GAP
        ty = rect.top + rect.height / 2 - TT_H / 2
      }
      return { x: tx, y: ty }
    }

    const fits = (tx: number, ty: number) => {
      return (
        tx >= GAP &&
        ty >= GAP &&
        tx + TT_W + GAP <= window.innerWidth &&
        ty + TT_H + GAP <= window.innerHeight
      )
    }

    const order: Record<TooltipPlacement, TooltipPlacement[]> = {
      top: ['top', 'bottom', 'right', 'left'],
      'top-left': ['top-left', 'bottom-left', 'right', 'left'],
      'top-right': ['top-right', 'bottom-right', 'left', 'right'],
      bottom: ['bottom', 'top', 'right', 'left'],
      'bottom-left': ['bottom-left', 'top-left', 'right', 'left'],
      'bottom-right': ['bottom-right', 'top-right', 'left', 'right'],
      left: ['left', 'right', 'top', 'bottom'],
      right: ['right', 'left', 'top', 'bottom'],
    }

    const placementsToTry = order[wantedPlacement]
    let placement = wantedPlacement
    let { x, y } = getCoords(placement)

    for (const p of placementsToTry) {
      const coords = getCoords(p)
      if (fits(coords.x, coords.y)) {
        placement = p
        x = coords.x
        y = coords.y
        break
      }
    }

    x = Math.max(GAP, Math.min(window.innerWidth - TT_W - GAP, x))
    y = Math.max(GAP, Math.min(window.innerHeight - TT_H - GAP, y))

    setTooltip({ visible: true, x, y, placement, text })
  }

  const hideTooltip = () => setTooltip(t => ({ ...t, visible: false }))

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>5. Умный tooltip с auto-flip</h3>
        <span className='bm-badge'>getBoundingClientRect + viewport</span>
      </div>
      <p className='bm-desc'>
        Классическая задача: tooltip должен показываться сверху, но если для него не хватает
        места — автоматически переключаться вниз / влево / вправо. Логика — чистая геометрия:
        измеряем <code>getBoundingClientRect()</code> кнопки, сравниваем с{' '}
        <code>window.innerWidth/Height</code>, выбираем placement. Прокрути страницу и наведи на
        крайние кнопки — увидишь, как tooltip "перепрыгивает".
      </p>

      <div className='bm-tooltip-grid'>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я слева сверху', 'top-left')} onMouseLeave={hideTooltip}>
          ↖ top-left
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я сверху по центру', 'top')} onMouseLeave={hideTooltip}>
          ↑ top-center
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я справа сверху', 'top-right')} onMouseLeave={hideTooltip}>
          ↗ top-right
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я слева снизу', 'bottom-left')} onMouseLeave={hideTooltip}>
          ↙ bottom-left
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я внизу по центру', 'bottom')} onMouseLeave={hideTooltip}>
          ↓ bottom-center
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я справа снизу', 'bottom-right')} onMouseLeave={hideTooltip}>
          ↘ bottom-right
        </button>
        <button
          className='bm-tt-btn'
          onMouseEnter={e => showTooltip(e, 'Я слева посередине', 'left')}
          onMouseLeave={hideTooltip}
        >
          ← left
        </button>
        <button
          className='bm-tt-btn'
          onMouseEnter={e => showTooltip(e, 'Я справа посередине', 'right')}
          onMouseLeave={hideTooltip}
        >
          → right
        </button>
      </div>

      {tooltip.visible && (
        <div
          className='bm-smart-tooltip'
          style={{ left: tooltip.x, top: tooltip.y, position: 'fixed' }}
        >
          <div className='bm-tt-text'>{tooltip.text}</div>
          <div className='bm-tt-meta'>placement: {tooltip.placement}</div>
        </div>
      )}

      <details className='bm-code-block'>
        <summary>Алгоритм auto-flip</summary>
        <pre>{`// 1. Измеряем триггер:
const rect = trigger.getBoundingClientRect();

// 2. Пробуем placement по умолчанию (сверху):
let y = rect.top - tooltipHeight - gap;
let placement = 'top';

// 3. Не влезаем сверху? — переключаемся вниз:
if (y < 0) {
  y = rect.bottom + gap;
  placement = 'bottom';
}

// 4. И снизу не влезаем? — пробуем сбоку.
if (y + tooltipHeight > window.innerHeight) {
  placement = rect.right + tooltipWidth + gap < window.innerWidth ? 'right' : 'left';
}

// 5. Финальный clamp, чтобы не вылезти по горизонтали:
x = Math.max(gap, Math.min(window.innerWidth - tooltipWidth - gap, x));

// ⚠️ Используем position: fixed + clientX/clientY (viewport), не pageY.
// fixed позиционируется ОТ viewport, точно как rect.top.

// ⚠️ Floating UI / Popper решают эту задачу для prod, но на интервью
// просят написать руками — алгоритм укладывается в 30 строк.`}</pre>
      </details>
    </div>
  )
}
