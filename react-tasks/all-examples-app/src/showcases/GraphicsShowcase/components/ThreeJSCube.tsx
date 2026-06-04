import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ThreeJSCube() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = 320

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f9ff)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.5, 4)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4, metalness: 0.2 })
    )
    scene.add(cube)

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.15, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.4 })
    )
    torus.position.set(1.8, 0, 0)
    scene.add(torus)

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2, metalness: 0.6 })
    )
    sphere.position.set(-1.8, 0, 0)
    scene.add(sphere)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.8
    scene.add(floor)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(5, 8, 5)
    scene.add(sun)

    let rafId = 0
    const animate = () => {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.012
      torus.rotation.x += 0.02
      torus.rotation.y += 0.01
      sphere.rotation.y += 0.015
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      const w = container.clientWidth
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>8. Three.js — первая 3D-сцена</h3>
        <span className='bm-badge'>Уровень 3 · 3D</span>
      </div>
      <p className='bm-desc'>
        Three.js — это <strong>обёртка над WebGL</strong>. Никаких шейдеров писать не нужно:
        даём готовые объекты <code>BoxGeometry</code>, <code>MeshStandardMaterial</code>,{' '}
        <code>DirectionalLight</code> — и библиотека сама генерирует шейдеры. 90% 3D-вебсайтов
        написаны на Three.js или её React-обёртке <code>@react-three/fiber</code>.
      </p>

      <div ref={containerRef} className='gfx-three-container' />

      <details className='bm-code-block'>
        <summary>Анатомия любой Three.js сцены — 5 шагов</summary>
        <pre>{`// 1. Scene → 2. Camera → 3. Renderer → 4. Mesh → 5. Light
// ⚠️ Куб чёрный → забыл добавить свет
// ⚠️ Куб не видно → камера ВНУТРИ куба
// ⚠️ Утечка памяти → не вызвал renderer.dispose() при unmount`}</pre>
      </details>
    </div>
  )
}
