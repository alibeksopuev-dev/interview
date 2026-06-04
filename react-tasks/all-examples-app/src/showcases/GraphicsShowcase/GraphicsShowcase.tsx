import './styles.css'
import { Canvas2DBasics } from './components/Canvas2DBasics'
import { Canvas2DAnimation } from './components/Canvas2DAnimation'
import { Canvas2DPaint } from './components/Canvas2DPaint'
import { PixiJSBasics } from './components/PixiJSBasics'
import { PixiJSParticles } from './components/PixiJSParticles'
import { WebGLTriangle } from './components/WebGLTriangle'
import { WebGLAnimatedShader } from './components/WebGLAnimatedShader'
import { ThreeJSCube } from './components/ThreeJSCube'
import { ThreeJSInteractive } from './components/ThreeJSInteractive'
import { GraphicsComparison } from './components/GraphicsComparison'

export function GraphicsShowcase() {
  return (
    <div className='bm-showcase'>
      <header className='bm-header'>
        <h1 className='bm-title'>Графика в браузере: Canvas → WebGL → Three.js</h1>
        <p className='bm-subtitle'>
          Три уровня сложности от простого к продвинутому. Прочитай <code>GraphicsShowcase.md</code>{' '}
          параллельно — там подробный план изучения и теория за каждым примером.
        </p>
      </header>

      <Canvas2DBasics />
      <Canvas2DAnimation />
      <Canvas2DPaint />
      <PixiJSBasics />
      <PixiJSParticles />
      <WebGLTriangle />
      <WebGLAnimatedShader />
      <ThreeJSCube />
      <ThreeJSInteractive />
      <GraphicsComparison />

      <div className='bm-footer-note'>
        💡 <strong>Топ-вопросы на интервью:</strong> разница Canvas vs SVG vs WebGL; что такое
        vertex/fragment shader; зачем <code>requestAnimationFrame</code> вместо{' '}
        <code>setInterval</code>; почему Three.js материал может быть чёрным (свет!); что такое
        device pixel ratio и почему canvas размытый на retina.
      </div>
    </div>
  )
}
