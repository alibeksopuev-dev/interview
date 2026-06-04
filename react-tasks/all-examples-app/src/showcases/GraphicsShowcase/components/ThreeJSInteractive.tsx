import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ThreeJSInteractive() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = 340

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        roughness: 0.3,
        metalness: 0.6,
        flatShading: true,
      })
    )
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.52, 0)),
      new THREE.LineBasicMaterial({ color: 0xfbbf24 })
    )
    group.add(ico)
    group.add(wire)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pl = new THREE.PointLight(0xff00ff, 50, 100)
    pl.position.set(3, 3, 3)
    scene.add(pl)
    const pl2 = new THREE.PointLight(0x00ffff, 50, 100)
    pl2.position.set(-3, -3, 3)
    scene.add(pl2)

    const state = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      targetRotY: 0,
      targetRotX: 0,
    }

    const onDown = (e: PointerEvent) => {
      state.dragging = true
      state.lastX = e.clientX
      state.lastY = e.clientY
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!state.dragging) return
      const dx = e.clientX - state.lastX
      const dy = e.clientY - state.lastY
      state.targetRotY += dx * 0.01
      state.targetRotX += dy * 0.01
      state.lastX = e.clientX
      state.lastY = e.clientY
    }
    const onUp = () => { state.dragging = false }

    const el = renderer.domElement
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.style.cursor = 'grab'

    let rafId = 0
    const animate = () => {
      group.rotation.y += (state.targetRotY - group.rotation.y) * 0.1
      group.rotation.x += (state.targetRotX - group.rotation.x) * 0.1
      if (!state.dragging) {
        state.targetRotY += 0.003
      }
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
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      renderer.dispose()
      container.removeChild(el)
    }
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>9. Three.js — интерактив (drag-to-rotate)</h3>
        <span className='bm-badge'>Уровень 3 · UX</span>
      </div>
      <p className='bm-desc'>
        Захвати объект мышью и потяни — он будет вращаться. Это базовый паттерн любого 3D-вьюера.
        Хитрость в <strong>линейной интерполяции (lerp)</strong>: вместо того, чтобы менять угол
        напрямую, мы плавно приближаемся к целевому — получается приятная инерция.
      </p>

      <div ref={containerRef} className='gfx-three-container gfx-three-dark' />

      <details className='bm-code-block'>
        <summary>Lerp — секрет плавных анимаций</summary>
        <pre>{`// Lerp каждый кадр:
group.rotation.y += (targetRotY - group.rotation.y) * 0.1
// коэффициент 0.1 = "за 10 кадров пройдём 99% пути".`}</pre>
      </details>
    </div>
  )
}
