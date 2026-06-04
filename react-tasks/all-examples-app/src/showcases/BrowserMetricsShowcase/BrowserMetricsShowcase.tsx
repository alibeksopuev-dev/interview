import './styles.css'
import { MouseCoordsDemo } from './components/MouseCoordsDemo'
import { ElementMetricsDemo } from './components/ElementMetricsDemo'
import { GetBoundingRectDemo } from './components/GetBoundingRectDemo'
import { DragDropDemo } from './components/DragDropDemo'
import { SmartTooltipDemo } from './components/SmartTooltipDemo'
import { CoordinateSystemsTable } from './components/CoordinateSystemsTable'

export function BrowserMetricsShowcase() {
  return (
    <div className='bm-showcase'>
      <header className='bm-header'>
        <h1 className='bm-title'>Координаты и метрики в браузере</h1>
        <p className='bm-subtitle'>
          Четыре системы координат, метрики DOM-элементов и <code>getBoundingClientRect</code> —
          интерактивно, с живыми примерами. Каждое свойство показано в действии.
        </p>
      </header>

      <MouseCoordsDemo />
      <ElementMetricsDemo />
      <GetBoundingRectDemo />
      <DragDropDemo />
      <SmartTooltipDemo />
      <CoordinateSystemsTable />

      <div className='bm-footer-note'>
        💡 <strong>Топ-вопросы на интервью:</strong> разница между <code>clientX</code> и{' '}
        <code>pageX</code>; почему <code>offsetX</code> может быть отрицательным; что такое layout
        thrashing; чем <code>getBoundingClientRect().width</code> отличается от{' '}
        <code>offsetWidth</code> при <code>transform: scale</code>.
      </div>
    </div>
  )
}
