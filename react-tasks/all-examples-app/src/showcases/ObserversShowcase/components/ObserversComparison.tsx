export function ObserversComparison() {
  return (
    <div className='obs-table-card'>
      <h3>Сравнение трёх observer-API</h3>
      <table className='obs-table'>
        <thead>
          <tr>
            <th>Свойство</th>
            <th>ResizeObserver</th>
            <th>IntersectionObserver</th>
            <th>MutationObserver</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Что наблюдает</strong></td>
            <td>Размер элемента (width, height, contentBox, borderBox)</td>
            <td>Пересечение с viewport / root-элементом</td>
            <td>Изменения DOM (children, attributes, text)</td>
          </tr>
          <tr>
            <td><strong>Когда срабатывает</strong></td>
            <td>В отдельной фазе после Layout, до Paint</td>
            <td>Асинхронно (обычно raf-подобно)</td>
            <td><strong>Микрозадача</strong> после mutation</td>
          </tr>
          <tr>
            <td><strong>Батчит изменения?</strong></td>
            <td>Да — все записи в одном callback</td>
            <td>Да — все entries в одном callback</td>
            <td>Да — за весь sync блок один вызов</td>
          </tr>
          <tr>
            <td><strong>Типичный use case</strong></td>
            <td>Адаптивные компоненты, charts без window.resize</td>
            <td>Lazy-load, infinite scroll, scroll-spy, impressions</td>
            <td>3rd-party виджеты, отслеживание привязок React Portal</td>
          </tr>
          <tr>
            <td><strong>Cleanup</strong></td>
            <td><code>observer.disconnect()</code></td>
            <td><code>unobserve(el)</code> или <code>disconnect()</code></td>
            <td><code>observer.disconnect()</code></td>
          </tr>
          <tr>
            <td><strong>Подводный камень</strong></td>
            <td>Loop при изменении размера внутри callback</td>
            <td>Колбэк отстаёт на ~1 frame от scroll</td>
            <td><code>subtree: true</code> на большом дереве = дорого</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
