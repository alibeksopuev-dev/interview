import { useState } from 'react'
import './styles.css'
import { METHOD_CASES } from './data/cases'
import { PromiseVisualizer } from './components/PromiseVisualizer'
import { StatesDiagram } from './components/StatesDiagram'
import { TheorySection } from './components/TheorySection'

type Tab = 'simulator' | 'states' | 'theory'

export function PromiseShowcase() {
  const [activeMethodId, setActiveMethodId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<Tab>('simulator')

  const activeMethod = METHOD_CASES.find(m => m.id === activeMethodId) || METHOD_CASES[0]

  return (
    <div style={{ padding: '32px 0', maxWidth: 1100 }}>
      {/* Header */}
      <div className='ps-header'>
        <h1 className='ps-title'>Визуальное обучение Promise API</h1>
        <p className='ps-subtitle'>
          Пошаговые интерактивные примеры всех методов промисов на русском языке.
          Запускай симуляции, смотри как меняется состояние, читай объяснения для новичков.
        </p>
      </div>

      {/* Top tab navigation */}
      <div className='ps-top-tabs'>
        {(
          [
            { id: 'simulator', label: 'Симулятор методов' },
            { id: 'states', label: 'Состояния промиса' },
            { id: 'theory', label: 'Теория и сравнения' },
          ] as { id: Tab; label: string }[]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`ps-top-tab-btn${activeTab === tab.id ? ' active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div>
          {/* Method selector */}
          <div className='ps-method-tabs'>
            {METHOD_CASES.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMethodId(m.id)}
                className={`ps-method-btn${activeMethodId === m.id ? ' active' : ''}`}
              >
                {m.title}
                <span className='ps-method-badge'>{m.badge}</span>
              </button>
            ))}
          </div>

          {/* Main content grid */}
          <div className='ps-grid'>
            {/* LEFT: description + code + visualizer */}
            <div className='ps-left-panel'>
              {/* Description */}
              <div className='ps-description-card'>
                <div className='ps-method-title'>{activeMethod.title}</div>
                <p className='ps-method-desc'>{activeMethod.description}</p>
                <div className='ps-tip'>
                  <span className='ps-tip-icon'>💡</span>
                  {activeMethod.tip}
                </div>
              </div>

              {/* Code block */}
              <div className='ps-card'>
                <div className='ps-card-header'>
                  <span className='ps-card-title'>Пример кода</span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TypeScript</span>
                </div>
                <div className='ps-code-block'>
                  {activeMethod.code.map((line, i) => (
                    <div key={i} className='ps-code-line'>
                      <span className='ps-code-num'>{i + 1}</span>
                      <span>{line || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualizer */}
              <div className='ps-card'>
                <div className='ps-card-header'>
                  <span className='ps-card-title'>Интерактивный симулятор</span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    {activeMethod.promises.length} промис{activeMethod.promises.length > 1 ? 'а' : ''}
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <PromiseVisualizer key={activeMethod.id} methodCase={activeMethod} />
                </div>
              </div>

              {/* Detailed Explanation / Under the Hood */}
              {(activeMethod.implementationCode || activeMethod.explanationSteps || activeMethod.complexity) && (
                <div className='ps-card' style={{ borderTop: '4px solid #4f46e5' }}>
                  <div className='ps-card-header' style={{ background: '#f8fafc' }}>
                    <span className='ps-card-title' style={{ fontSize: '13px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚙️ Под капотом: устройство и ручная реализация
                    </span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Complexity Badges */}
                    {activeMethod.complexity && (
                      <div className='ps-complexity-container'>
                        <div className='ps-complexity-badge'>
                          <span className='ps-complexity-label'>Time Complexity:</span>
                          <span className='ps-complexity-value'>{activeMethod.complexity.time}</span>
                        </div>
                        <div className='ps-complexity-badge'>
                          <span className='ps-complexity-label'>Space Complexity:</span>
                          <span className='ps-complexity-value'>{activeMethod.complexity.space}</span>
                        </div>
                      </div>
                    )}

                    {/* Resolve/Reject & .then/.catch Connection */}
                    {activeMethod.resolveRejectConnection && (
                      <div className='ps-theory-callout'>
                        <div className='ps-theory-callout-title'>Связь resolve/reject c .then/.catch/.finally</div>
                        <div className='ps-theory-callout-text'>{activeMethod.resolveRejectConnection}</div>
                      </div>
                    )}

                    {/* Custom Implementation Code */}
                    {activeMethod.implementationCode && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Ручной аналог (на базе new Promise)</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>JavaScript / TypeScript</span>
                        </div>
                        <div className='ps-code-block' style={{ borderRadius: '8px' }}>
                          {activeMethod.implementationCode.map((line, i) => (
                            <div key={i} className='ps-code-line'>
                              <span className='ps-code-num'>{i + 1}</span>
                              <span>{line || ' '}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step-by-step walkthrough */}
                    {activeMethod.explanationSteps && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
                          Пошаговый алгоритм работы
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {activeMethod.explanationSteps.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                              <div className='ps-step-num'>{idx + 1}</div>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                                  {step.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                                  {step.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: quick reference */}
            <div className='ps-right-panel'>
              <div className='ps-card'>
                <div className='ps-card-header'>
                  <span className='ps-card-title'>Краткая шпаргалка</span>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { method: 'Promise.all(arr)', badge: 'Все или ничего', color: '#4f46e5', desc: 'Ждёт всех. Первый reject → reject всего.' },
                    { method: 'Promise.allSettled(arr)', badge: 'Все без исключений', color: '#0891b2', desc: 'Ждёт всех. Никогда не reject.' },
                    { method: 'Promise.race(arr)', badge: 'Первый любой', color: '#d97706', desc: 'Первый завершившийся (успех ИЛИ ошибка).' },
                    { method: 'Promise.any(arr)', badge: 'Первый успех', color: '#7c3aed', desc: 'Первый fulfilled. Reject если все упали.' },
                    { method: 'Promise.resolve(val)', badge: 'Утилита', color: '#059669', desc: 'Создаёт уже выполненный промис.' },
                    { method: 'Promise.reject(err)', badge: 'Утилита', color: '#ef4444', desc: 'Создаёт уже отклонённый промис.' },
                    { method: 'new Promise(exec)', badge: 'Конструктор', color: '#64748b', desc: 'Ручное создание. executor запускается синхронно.' },
                    { method: '.then(onF, onR)', badge: 'Экземпляр', color: '#1e293b', desc: 'Обрабатывает успех и/или ошибку.' },
                    { method: '.catch(onR)', badge: 'Экземпляр', color: '#1e293b', desc: 'Обрабатывает только ошибки.' },
                    { method: '.finally(fn)', badge: 'Экземпляр', color: '#1e293b', desc: 'Выполняется всегда. Не получает значение.' },
                  ].map(item => (
                    <div
                      key={item.method}
                      onClick={() => {
                        const found = METHOD_CASES.find(m =>
                          item.method.includes(m.title.split(' ')[1] || m.id)
                        )
                        if (found) setActiveMethodId(found.id)
                      }}
                      style={{
                        padding: '10px 12px',
                        background: activeMethod.title === item.method.split('(')[0] ? item.color + '10' : '#f8fafc',
                        border: `1px solid ${activeMethod.title === item.method.split('(')[0] ? item.color + '60' : '#e2e8f0'}`,
                        borderRadius: 8,
                        cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <code style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.method}</code>
                        <span style={{ fontSize: 10, padding: '1px 6px', background: item.color + '20', color: item.color, borderRadius: 9999, fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analogy */}
              <div className='ps-card'>
                <div className='ps-card-header'>
                  <span className='ps-card-title'>Аналогия из жизни</span>
                </div>
                <div style={{ padding: '14px 16px', fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong style={{ color: '#1e293b' }}>Промис</strong> — как квитанция из химчистки. Ты сдал вещи (запустил операцию),
                    получил бумажку (промис). Вещи ещё не готовы — но когда будут, ты придёшь с этой бумажкой и заберёшь их.
                  </p>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong style={{ color: '#4f46e5' }}>Promise.all</strong> — сдал 3 вещи, ждёшь пока все будут готовы.
                    Если одна потерялась — никто ничего не отдаёт.
                  </p>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong style={{ color: '#d97706' }}>Promise.race</strong> — несёшь ноутбук сразу в 3 сервисных центра.
                    Кто первый позвонит, к тому и едешь.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: '#7c3aed' }}>Promise.any</strong> — спрашиваешь у 3 друзей дорогу. Первый, кто знает — отвечает.
                    Незнание одного не значит ничего.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATES TAB */}
      {activeTab === 'states' && (
        <div className='ps-card' style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Три состояния промиса
          </h2>
          <StatesDiagram />
        </div>
      )}

      {/* THEORY TAB */}
      {activeTab === 'theory' && (
        <div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Теория, сравнения и подводные камни
          </h2>
          <TheorySection />
        </div>
      )}
    </div>
  )
}
