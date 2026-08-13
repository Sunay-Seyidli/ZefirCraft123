import React, { useEffect, useRef, useState } from "react";

interface MinecraftBackgroundProps {
  imageSrc?: string;
  mobileImageSrc?: string;
}

export default function MinecraftBackground({
  imageSrc = "/bg-earth.jpg",
  mobileImageSrc = "/bg-earth-mobile.jpg",
}: MinecraftBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    // Try preloading the background image
    const img = new Image();
    img.src = window.innerWidth <= 640 && mobileImageSrc ? mobileImageSrc : imageSrc;
    img.onload = () => {
      // Test if image has real dimensions
      if (img.naturalWidth > 50 && img.naturalHeight > 50) {
        setImageLoaded(true);
      } else {
        setImageFailed(true);
      }
    };
    img.onerror = () => {
      setImageFailed(true);
    };
  }, [imageSrc, mobileImageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle system (Minecraft glowing ambient particles / Towny embers)
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.4 ? "56, 189, 248" : "251, 191, 36", // cyan or gold
    }));

    // Cloud system (Minecraft 3D blocky clouds)
    const cloudCount = 8;
    const clouds = Array.from({ length: cloudCount }, (_, i) => ({
      x: (i * width) / cloudCount + Math.random() * 100,
      y: Math.random() * (height * 0.25) + 30,
      width: Math.random() * 180 + 120,
      height: Math.random() * 30 + 20,
      speed: Math.random() * 0.15 + 0.08,
      blocks: Math.floor(Math.random() * 4) + 3,
    }));

    // Star field for deep sky
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.5),
      size: Math.floor(Math.random() * 2) + 2,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
    }));

    let time = 0;

    const render = () => {
      time += 0.01;

      // 1. Sky Gradient (Sunset into Deep Space Cyan/Navy)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#030712"); // deep midnight
      skyGrad.addColorStop(0.35, "#081b3b"); // deep indigo
      skyGrad.addColorStop(0.65, "#0f3156"); // dusk cyan
      skyGrad.addColorStop(0.85, "#1e3a5f"); // sunset horizon
      skyGrad.addColorStop(1, "#071326"); // earth base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Minecraft Square Sun / Glow
      const sunX = width * 0.75;
      const sunY = height * 0.28;
      const sunSize = 36;

      // Sun halo glow
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
      sunGlow.addColorStop(0, "rgba(56, 189, 248, 0.4)");
      sunGlow.addColorStop(0.5, "rgba(14, 165, 233, 0.15)");
      sunGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(sunX - 200, sunY - 200, 400, 400);

      // Sun square body (Minecraft aesthetic)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sunX - sunSize / 2, sunY - sunSize / 2, sunSize, sunSize);
      ctx.fillStyle = "rgba(224, 242, 254, 0.8)";
      ctx.fillRect(sunX - sunSize / 2 + 4, sunY - sunSize / 2 + 4, sunSize - 8, sunSize - 8);

      // 3. Stars (Square Minecraft Pixels)
      stars.forEach((s) => {
        const currentAlpha = Math.abs(Math.sin(time * s.twinkleSpeed * 100)) * 0.5 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // 4. Minecraft Blocky Clouds
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > width + 200) {
          cloud.x = -250;
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        const stepW = cloud.width / cloud.blocks;
        for (let b = 0; b < cloud.blocks; b++) {
          const blockH = cloud.height + (b % 2 === 0 ? 8 : -4);
          ctx.fillRect(cloud.x + b * stepW, cloud.y, stepW + 2, blockH);
          ctx.fillStyle = "rgba(186, 230, 253, 0.18)";
          ctx.fillRect(cloud.x + b * stepW + 2, cloud.y + 2, stepW - 2, 4);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        }
      });

      // 5. Distant Voxel Mountains (Layer 1 - Stepped blocky terrain)
      const mountainY = height * 0.62;
      ctx.fillStyle = "#0c2340";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, mountainY + 40);

      const blockSize = 24;
      for (let x = 0; x < width; x += blockSize) {
        // Procedural stepped mountain height
        const h1 = Math.sin(x * 0.003) * 90;
        const h2 = Math.cos(x * 0.007) * 45;
        const stepY = mountainY - h1 - h2;
        const steppedY = Math.round(stepY / 12) * 12;
        ctx.lineTo(x, steppedY);
        ctx.lineTo(x + blockSize, steppedY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Mountain Snow Caps
      ctx.fillStyle = "rgba(186, 230, 253, 0.25)";
      for (let x = 0; x < width; x += blockSize * 2) {
        const h1 = Math.sin(x * 0.003) * 90;
        const h2 = Math.cos(x * 0.007) * 45;
        const stepY = mountainY - h1 - h2;
        if (stepY < mountainY - 40) {
          const steppedY = Math.round(stepY / 12) * 12;
          ctx.fillRect(x, steppedY, blockSize * 2, 12);
        }
      }

      // 6. Midground Voxel Hills & Minecraft Forest / Castle (Layer 2)
      const hillY = height * 0.74;
      ctx.fillStyle = "#081a33";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, hillY);

      for (let x = 0; x < width; x += 16) {
        const h = Math.sin(x * 0.006 + 1.2) * 40 + Math.cos(x * 0.012) * 20;
        const steppedY = Math.round((hillY - h) / 10) * 10;
        ctx.lineTo(x, steppedY);
        ctx.lineTo(x + 16, steppedY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Render Blocky Minecraft Trees along the hill
      for (let x = 40; x < width; x += 110) {
        const h = Math.sin(x * 0.006 + 1.2) * 40 + Math.cos(x * 0.012) * 20;
        const baseTreeY = Math.round((hillY - h) / 10) * 10;

        // Tree trunk (Oak wood)
        ctx.fillStyle = "#1e1b18";
        ctx.fillRect(x + 10, baseTreeY - 32, 8, 32);

        // Tree Leaves (Minecraft Stepped Leaves)
        ctx.fillStyle = "#0e3a2f";
        ctx.fillRect(x - 2, baseTreeY - 56, 32, 16);
        ctx.fillStyle = "#144e3f";
        ctx.fillRect(x + 2, baseTreeY - 68, 24, 14);
        ctx.fillStyle = "#1b6350";
        ctx.fillRect(x + 6, baseTreeY - 76, 16, 10);
      }

      // 7. Foreground Minecraft Earth Grass / Fortress Terrain (Layer 3)
      const fgY = height * 0.86;
      ctx.fillStyle = "#051122";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, fgY);

      for (let x = 0; x < width; x += 20) {
        const h = Math.sin(x * 0.004) * 20;
        const steppedY = Math.round((fgY - h) / 8) * 8;
        ctx.lineTo(x, steppedY);
        ctx.lineTo(x + 20, steppedY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Top grass block highlight
      ctx.fillStyle = "rgba(14, 165, 233, 0.35)";
      for (let x = 0; x < width; x += 20) {
        const h = Math.sin(x * 0.004) * 20;
        const steppedY = Math.round((fgY - h) / 8) * 8;
        ctx.fillRect(x, steppedY, 20, 6);
      }

      // Castle Tower on Left & Right
      const renderCastleTower = (towerX: number, towerH: number) => {
        ctx.fillStyle = "#0a1f3a";
        ctx.fillRect(towerX, height - towerH, 60, towerH);
        // Battlements
        ctx.fillRect(towerX - 6, height - towerH - 12, 72, 12);
        ctx.fillStyle = "#061324";
        ctx.fillRect(towerX + 12, height - towerH - 12, 16, 12);
        ctx.fillRect(towerX + 44, height - towerH - 12, 16, 12);

        // Glowing Torch/Lantern in tower
        const torchPulse = Math.sin(time * 8) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(251, 191, 36, ${torchPulse})`;
        ctx.fillRect(towerX + 26, height - towerH + 20, 8, 12);
      };

      if (width > 768) {
        renderCastleTower(width * 0.08, 160);
        renderCastleTower(width * 0.88, 140);
      }

      // 8. Rising Magical Spore / Particle Embers (Voxel floating cubes)
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      id="minecraft-procedural-bg-container"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#030a16]"
    >
      {/* 1. Procedural High-Performance Pure Code Canvas (Always works everywhere: Vercel, GitHub, Localhost, Mobile) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: "pixelated" }}
      />

      {/* 2. Real Image Layer with Smooth Blend if loaded */}
      {imageLoaded && !imageFailed && (
        <picture className="absolute inset-0 w-full h-full">
          <source media="(max-width: 640px)" srcSet={mobileImageSrc} />
          <img
            src={imageSrc}
            alt="Minecraft Earth World"
            className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.05] opacity-90 transition-opacity duration-1000"
            onError={() => setImageFailed(true)}
          />
        </picture>
      )}

      {/* 3. Deep Atmospheric Shading & Vignette for Perfect Card Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060e1f]/60 via-[#030814]/30 to-[#040915]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.85)_100%)]" />
    </div>
  );
}
