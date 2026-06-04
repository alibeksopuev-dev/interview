export function CoordinateSystemsTable() {
  return (
    <div className='bm-table-card'>
      <h3>Четыре системы координат — когда какую использовать</h3>
      <table className='bm-table'>
        <thead>
          <tr>
            <th>Система</th>
            <th>Точка отсчёта</th>
            <th>Меняется при scroll окна?</th>
            <th>Где использовать</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Document</strong>
              <br />
              <code>pageX/Y</code>
            </td>
            <td>Левый верх документа (включая прокрутку)</td>
            <td>Нет (абсолютная позиция)</td>
            <td>Drag &amp; Drop, "залипшие" tooltip'ы относительно контента</td>
          </tr>
          <tr>
            <td>
              <strong>Viewport</strong>
              <br />
              <code>clientX/Y</code>
            </td>
            <td>Левый верх viewport браузера</td>
            <td>Да (постоянно меняется при scroll)</td>
            <td>Модалки, dropdown'ы, popover'ы, position: fixed</td>
          </tr>
          <tr>
            <td>
              <strong>Element-local</strong>
              <br />
              <code>offsetX/Y</code>
            </td>
            <td>Левый верх target-элемента события</td>
            <td>Нет (локально внутри элемента)</td>
            <td>Canvas (точка клика на холсте), drag handles, координаты внутри карты</td>
          </tr>
          <tr>
            <td>
              <strong>Screen</strong>
              <br />
              <code>screenX/Y</code>
            </td>
            <td>Левый верх физического экрана</td>
            <td>Нет</td>
            <td>Multi-window координация, window.open позиционирование</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
