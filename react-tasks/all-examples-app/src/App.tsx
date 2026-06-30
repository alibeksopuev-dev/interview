import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DataTableShowcase } from './showcases/DataTableShowcase/DataTableShowcase'
import { ThrottleShowcase } from './showcases/ThrottleShowcase/ThrottleShowcase'
import { UseQueryShowcase } from './showcases/UseQueryShowcase/UseQueryShowcase'
import { SelectDataShowcase } from './showcases/SelectDataShowcase/SelectDataShowcase'
import { EventLoopShowcase } from './showcases/EventLoopShowcase/EventLoopShowcase'
import { ObserversShowcase } from './showcases/ObserversShowcase/ObserversShowcase'
import { BrowserMetricsShowcase } from './showcases/BrowserMetricsShowcase/BrowserMetricsShowcase'
import { GraphicsShowcase } from './showcases/GraphicsShowcase/GraphicsShowcase'
import { BigOShowcase } from './showcases/BigOShowcase/BigOShowcase'
import { AlgoShowcase } from './showcases/AlgoShowcase/AlgoShowcase'
import { PromiseShowcase } from './showcases/PromiseShowcase/PromiseShowcase'
import { RefactorShowcase } from './showcases/RefactorShowcase/RefactorShowcase'

const NAV_ITEMS = [
  { to: '/data-table', label: 'DataTable', badge: 'Generic' },
  { to: '/throttle', label: 'Throttle', badge: 'Hook' },
  { to: '/use-query', label: 'useQuery', badge: 'Hook' },
  { to: '/select-data', label: 'selectData', badge: 'Filter' },
  { to: '/event-loop', label: 'Event Loop', badge: 'Simulator' },
  { to: '/observers', label: 'Observers', badge: 'DOM' },
  { to: '/browser-metrics', label: 'Browser Metrics', badge: 'Coords' },
  { to: '/graphics', label: 'Graphics', badge: 'Canvas' },
  { to: '/big-o', label: 'Big O', badge: 'Algo' },
  { to: '/algo', label: 'Algorithms', badge: 'DS&A' },
  { to: '/promise', label: 'Promise API', badge: 'Async' },
  { to: '/refactor', label: 'Refactor', badge: 'Trainer' },
]

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => {
    setIsOpen(!isOpen)
  }
  return (
    <div className='app-layout'>
      <Sidebar
        items={NAV_ITEMS}
        isOpen={isOpen}
        onToggle={toggle}
      />

      <main className='app-main'>
        <Routes>
          <Route
            path='/'
            element={
              <Navigate
                to='/data-table'
                replace
              />
            }
          />
          <Route
            path='/data-table'
            element={<DataTableShowcase />}
          />
          <Route
            path='/throttle'
            element={
              <div className='page-content'>
                <ThrottleShowcase />
              </div>
            }
          />
          <Route
            path='/use-query'
            element={
              <div className='page-content'>
                <UseQueryShowcase />
              </div>
            }
          />
          <Route
            path='/select-data'
            element={<SelectDataShowcase />}
          />
          <Route
            path='/event-loop'
            element={
              <div className='page-content'>
                <EventLoopShowcase />
              </div>
            }
          />
          <Route
            path='/observers'
            element={
              <div className='page-content'>
                <ObserversShowcase />
              </div>
            }
          />
          <Route
            path='/browser-metrics'
            element={
              <div className='page-content'>
                <BrowserMetricsShowcase />
              </div>
            }
          />
          <Route
            path='/graphics'
            element={
              <div className='page-content'>
                <GraphicsShowcase />
              </div>
            }
          />
          <Route
            path='/big-o'
            element={
              <div className='page-content'>
                <BigOShowcase />
              </div>
            }
          />
          <Route
            path='/algo'
            element={
              <div className='page-content'>
                <AlgoShowcase />
              </div>
            }
          />
          <Route
            path='/promise'
            element={
              <div className='page-content'>
                <PromiseShowcase />
              </div>
            }
          />
          <Route
            path='/refactor'
            element={
              <div className='page-content'>
                <RefactorShowcase />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
