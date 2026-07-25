export const GridFloor = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ perspective: '1000px' }}>
            <style>{`
                @keyframes gridMove {
                    0% { transform: rotateX(60deg) translateY(0); }
                    100% { transform: rotateX(60deg) translateY(50px); }
                }
            `}</style>
            <div
                className="absolute inset-x-[-50%] bottom-[-50%] h-[200%] w-[200%]"
                style={{
                    background: `
                        linear-gradient(transparent 0%, rgba(231, 138, 83, 0.06) 1px, transparent 2px),
                        linear-gradient(90deg, transparent 0%, rgba(212, 160, 96, 0.06) 1px, transparent 2px)
                    `,
                    backgroundSize: '50px 50px',
                    transform: 'rotateX(60deg)',
                    transformOrigin: '50% 100%',
                    animation: 'gridMove 20s linear infinite',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 60%)',
                }}
            />
            <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-[0.06]" style={{ backgroundColor: '#e78a53' }} />
        </div>
    );
};