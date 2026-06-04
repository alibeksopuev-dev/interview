import './styles.css'
import { ResizeObserverDemo } from './components/ResizeObserverDemo'
import { IntersectionObserverDemo } from './components/IntersectionObserverDemo'
import { MutationObserverDemo } from './components/MutationObserverDemo'
import { ObserversComparison } from './components/ObserversComparison'

export function ObserversShowcase() {
  return (
    <div className='obs-showcase'>
      <header className='obs-header'>
        <h1 className='obs-title'>Browser Observers API</h1>
        <p className='obs-subtitle'>
          Три современных observer-API для отслеживания изменений в DOM и viewport: размеры,
          видимость и мутации. Каждый имеет свои правила выполнения относительно Event Loop.
        </p>
      </header>

      <ResizeObserverDemo />
      <IntersectionObserverDemo />
      <MutationObserverDemo />
      <ObserversComparison />

      <div className='obs-footer-note'>
        💡 Когда задают на интервью: «как реализовать lazy-load картинок без библиотек?» —{' '}
        <strong>IntersectionObserver</strong>. «Как чарт узнаёт о ресайзе своего контейнера, а не
        окна?» — <strong>ResizeObserver</strong>. «Как библиотека следит за DOM, который меняет
        не она?» — <strong>MutationObserver</strong>.
      </div>
    </div>
  )
}
