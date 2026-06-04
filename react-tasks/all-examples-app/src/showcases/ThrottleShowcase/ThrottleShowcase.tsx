import { FC } from 'react'
import './styles.css'
import { ScrollTracker } from './components/ScrollTracker'
import { SubmitButton } from './components/SubmitButton'
import { ResizeAwareComponent } from './components/ResizeAwareComponent'
import { RafTracker } from './components/RafTracker'

export const ThrottleShowcase: FC = () => {
  return (
    <div className='throttle-showcase-container'>
      <h2 className='showcase-title'>Демонстрация работы Throttle (Ограничение частоты)</h2>
      <p className='showcase-subtitle'>
        Throttle вызывает функцию немедленно при первом событии, а затем временно блокирует
        последующие вызовы на заданный интервал.
      </p>

      <div className='throttle-grid'>
        <ScrollTracker />
        <SubmitButton />
        <ResizeAwareComponent />
        <RafTracker />
      </div>
    </div>
  )
}
