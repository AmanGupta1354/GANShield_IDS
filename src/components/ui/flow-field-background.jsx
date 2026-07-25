import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function FlowFieldBackground({
  className,
  color = "#6366f1",
  trailOpacity = 0.15,
  particleCount = 600,
  speed = 1,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let particles = [];
    let animationFrameId;
    let mouse = { x: -1000, y: -1000, active: false };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
        this.life = Math.random() * 200 + 100;
        this.driftX = Math.random() * 2 - 1;
        this.driftY = Math.random() * 2 - 1;
      }

      update() {
        this.driftX += (Math.random() - 0.5) * 0.08;
        this.driftY += (Math.random() - 0.5) * 0.08;
        this.driftX *= 0.96;
        this.driftY *= 0.96;

        this.vx += this.driftX * 0.045 * speed;
        this.vy += this.driftY * 0.045 * speed;

        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionRadius = 170;

          if (distance < interactionRadius) {
            const force = (interactionRadius - distance) / interactionRadius;
            const invDist = 1 / (distance + 0.001);
            this.vx -= dx * invDist * force * 2.2 * speed;
            this.vy -= dy * invDist * force * 2.2 * speed;
          }
        }

        const maxVelocity = 2.2 * speed;
        const velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (velocity > maxVelocity) {
          const ratio = maxVelocity / velocity;
          this.vx *= ratio;
          this.vy *= ratio;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.92;
        this.vy *= 0.92;

        this.age++;
        if (this.age > this.life) {
          this.reset();
        }

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;
        this.driftX = Math.random() * 2 - 1;
        this.driftY = Math.random() * 2 - 1;
        this.age = 0;
        this.life = Math.random() * 200 + 100;
      }

      draw(context) {
        context.fillStyle = color;
        const alpha = 1 - Math.abs((this.age / this.life) - 0.5) * 2;
        context.globalAlpha = alpha;
        context.fillRect(this.x, this.y, 1.5, 1.5);
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${trailOpacity})`;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      init();
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    init();
    animate();

    window.addEventListener("resize", handleResize);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, trailOpacity, particleCount, speed]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}