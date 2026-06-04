import { useEffect, useRef, useState } from 'react'

export function WebGLAnimatedShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) {
      setError('WebGL не поддерживается')
      return
    }

    const vsSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    const fsSrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 c  = uv * 2.0 - 1.0;
        float d = length(c);
        float a = atan(c.y, c.x);
        float v = sin(d * 8.0 - u_time * 2.0)
                + sin(a * 5.0 + u_time)
                + sin((c.x + c.y) * 4.0 + u_time * 1.5);
        v /= 3.0;
        vec3 col = 0.5 + 0.5 * vec3(
          sin(v * 3.14 + 0.0),
          sin(v * 3.14 + 2.1),
          sin(v * 3.14 + 4.2)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || 'compile error')
      }
      return s
    }

    let program: WebGLProgram
    try {
      const vs = compile(gl.VERTEX_SHADER, vsSrc)
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc)
      program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'link error')
      }
    } catch (e) {
      setError((e as Error).message)
      return
    }
    gl.useProgram(program)

    // prettier-ignore
    const quad = new Float32Array([
      -1, -1,   1, -1,   -1, 1,
      -1,  1,   1, -1,    1, 1,
    ])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2f(uRes, canvas.width, canvas.height)

    const start = performance.now()
    let rafId = 0
    const tick = () => {
      const t = (performance.now() - start) / 1000
      gl.uniform1f(uTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>7. WebGL — анимированный фрагментный шейдер</h3>
        <span className='bm-badge'>Уровень 2 · Шейдеры</span>
      </div>
      <p className='bm-desc'>
        Тот же WebGL, но теперь рисуем <strong>"fullscreen quad"</strong> (два треугольника на весь
        экран) и вся магия — в <strong>фрагментном шейдере</strong>. Передаём{' '}
        <code>u_time</code> через <code>uniform</code>, и каждый пиксель сам считает свой цвет.
        Так делают Shadertoy и большинство визуальных эффектов в играх.
      </p>

      <canvas ref={canvasRef} width={460} height={300} className='gfx-canvas' />
      {error && <div className='gfx-error'>⚠️ {error}</div>}

      <details className='bm-code-block'>
        <summary>Идея: вычислительная мощь на стороне GPU</summary>
        <pre>{`// Uniform — переменная, общая для всех пикселей этого кадра:
uniform float u_time;        // время с запуска
uniform vec2  u_resolution;  // размер canvas

// gl_FragCoord — встроенный input: позиция текущего пикселя
// gl.uniform1f(gl.getUniformLocation(program, 'u_time'), elapsedSec)

// На каждом кадре fragment shader вызывается ОДИН РАЗ на КАЖДЫЙ ПИКСЕЛЬ.
// При 460x300 это 138 000 вызовов за кадр, при 60 fps — 8.3 миллиона/сек.`}</pre>
      </details>
    </div>
  )
}
