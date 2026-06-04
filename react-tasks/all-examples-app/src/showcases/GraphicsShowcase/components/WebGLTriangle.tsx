import { useEffect, useRef, useState } from 'react'

export function WebGLTriangle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      setError('WebGL не поддерживается в этом браузере')
      return
    }

    const vertexSrc = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      varying vec3 v_color;
      void main() {
        v_color = a_color;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    const fragmentSrc = `
      precision mediump float;
      varying vec3 v_color;
      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error(`Shader compile error: ${log}`)
      }
      return shader
    }

    let program: WebGLProgram
    try {
      const vs = compile(gl.VERTEX_SHADER, vertexSrc)
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc)
      program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Link error: ${gl.getProgramInfoLog(program)}`)
      }
    } catch (e) {
      setError((e as Error).message)
      return
    }

    gl.useProgram(program)

    // prettier-ignore
    const vertices = new Float32Array([
       0.0,   0.8,   1.0, 0.2, 0.3,
      -0.8,  -0.6,   0.2, 0.8, 0.4,
       0.8,  -0.6,   0.2, 0.5, 1.0,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const FSIZE = vertices.BYTES_PER_ELEMENT

    const aPosition = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, FSIZE * 5, 0)

    const aColor = gl.getAttribLocation(program, 'a_color')
    gl.enableVertexAttribArray(aColor)
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2)

    gl.clearColor(0.95, 0.97, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>6. WebGL — "Hello, Triangle!"</h3>
        <span className='bm-badge'>Уровень 2 · GPU</span>
      </div>
      <p className='bm-desc'>
        WebGL — это <strong>совсем другой</strong> мир. Здесь ты не "рисуешь" фигуры, а
        загружаешь <strong>массив вершин</strong> в видеокарту и пишешь две мини-программы —{' '}
        <strong>шейдеры</strong> — которые крутятся прямо на GPU. Это сложно, но в сотни раз
        быстрее для сложной графики. Треугольник ниже — самый простой пример (≈40 строк JS +
        2 шейдера).
      </p>

      <canvas ref={canvasRef} width={460} height={300} className='gfx-canvas' />
      {error && <div className='gfx-error'>⚠️ {error}</div>}

      <details className='bm-code-block'>
        <summary>Что произошло — шаг за шагом</summary>
        <pre>{`// ШАГ 1: vertex shader → позиция вершины
// ШАГ 2: fragment shader → цвет пикселя (интерполируется между вершинами)
// ШАГ 3: компиляция → линковка → программа
// ШАГ 4: загрузка вершин в GPU-буфер
// ШАГ 5: vertexAttribPointer — как читать буфер
// ШАГ 6: gl.drawArrays(gl.TRIANGLES, 0, 3)

// ⚠️ КООРДИНАТЫ WebGL: -1..+1, центр (0,0), Y ВВЕРХ
// (в Canvas 2D было: 0..width, (0,0) сверху, Y вниз)`}</pre>
      </details>
    </div>
  )
}
