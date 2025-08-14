
import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { createFireSystem, createStarfieldSystem, createDigitalRainSystem, createSnowfallSystem } from './particleSystems';

const BackgroundAmbiance: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { userProfile } = useAppContext();
    const animationFrameId = useRef<number | null>(null);
    
    // Using refs to hold systems to avoid re-creation on re-renders
    const particleSystems = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Update particle systems based on profile settings
        particleSystems.current = [];
        const ambiance = userProfile?.emojiAmbiance || [];

        if (ambiance.includes('🔥')) particleSystems.current.push(createFireSystem(canvas));
        if (ambiance.includes('✨')) particleSystems.current.push(createStarfieldSystem(canvas));
        if (ambiance.includes('💻')) particleSystems.current.push(createDigitalRainSystem(canvas));
        if (ambiance.includes('❄️')) particleSystems.current.push(createSnowfallSystem(canvas));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particleSystems.current.forEach(system => system.update(ctx));
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [userProfile?.emojiAmbiance]); // Rerun effect when ambiance settings change

    if (!userProfile?.emojiAmbiance || userProfile.emojiAmbiance.length === 0) {
        return null;
    }

    return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-transparent pointer-events-none" />;
};

export default BackgroundAmbiance;
