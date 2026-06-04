import { useState, FC } from 'react'
import './styles.css'
import { CharacterById } from './components/CharacterById'
import { CharactersList } from './components/CharactersList'
import { ErrorDemo } from './components/ErrorDemo'
import { SearchDemo } from './components/SearchDemo'
import { CacheDemo } from './components/CacheDemo'
import { DedupeDemo } from './components/DedupeDemo'
import { RetryDemo } from './components/RetryDemo'
import { RevalidateDemo } from './components/RevalidateDemo'

export const UseQueryShowcase: FC = () => {
  const [characterId, setCharacterId] = useState(1)

  return (
    <div className='uq-showcase'>
      <div className='card-header'>
        <h2 style={{ margin: 0, fontSize: 20 }}>useQuery Hook</h2>
        <span className='badge badge-purple'>Rick &amp; Morty API</span>
      </div>
      <p className='card-desc'>
        Демонстрация хука <code>useQuery</code> — управление промисом через <code>useEffect</code>{' '}
        с защитой от Race Condition через флаг <code>ignore</code>.
      </p>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>1. Одиночный запрос — смена ID</h3>
          <span className='badge badge-blue'>Race Condition защита</span>
        </div>
        <p className='uq-desc'>
          Каждый клик меняет <code>id</code> в зависимостях — предыдущий запрос отменяется через
          флаг <code>ignore</code>. Нажимай быстро, чтобы увидеть скелетон-загрузку.
        </p>
        <div className='uq-id-controls'>
          {[1, 2, 3, 4, 5, 826].map(id => (
            <button
              key={id}
              className={`uq-btn ${characterId === id ? 'uq-btn-active' : ''}`}
              onClick={() => setCharacterId(id)}
            >
              #{id}
            </button>
          ))}
        </div>
        <div className='uq-card'>
          <CharacterById id={characterId} />
        </div>
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>2. Список с пагинацией</h3>
          <span className='badge badge-amber'>826 персонажей / 42 страницы</span>
        </div>
        <p className='uq-desc'>
          Переключение страниц меняет <code>page</code> в deps. Если быстро кликать — хук всегда
          покажет данные только последней запрошенной страницы.
        </p>
        <CharactersList />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>3. Обработка ошибки</h3>
          <span className='badge badge-red'>status: error</span>
        </div>
        <ErrorDemo />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>4. Поиск по имени — Race Condition в действии</h3>
          <span className='badge badge-blue'>debounce 400мс</span>
        </div>
        <SearchDemo />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>5. Кэширование</h3>
          <span className='badge badge-green'>useQueryCached</span>
        </div>
        <CacheDemo />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>6. Дедупликация запросов</h3>
          <span className='badge badge-purple'>useQueryDeduped</span>
        </div>
        <DedupeDemo />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>7. Повтор при ошибке</h3>
          <span className='badge badge-amber'>useQueryRetry · exp backoff</span>
        </div>
        <RetryDemo />
      </div>

      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>8. Фоновая ревалидация</h3>
          <span className='badge badge-blue'>stale-while-revalidate</span>
        </div>
        <RevalidateDemo />
      </div>
    </div>
  )
}
