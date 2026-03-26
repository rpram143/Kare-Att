import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function SplashScreen({ show = true }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="splash-container"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(30px)' }}
                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#041329',
                        overflow: 'hidden'
                    }}
                >
                    {/* Atmospheric Orbs */}
                    <div className="bg-orbs" style={{ filter: 'blur(120px)', opacity: 0.4 }}>
                        <motion.div
                            style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'var(--primary-glow)' }}
                            animate={{ x: [0, 40, 0], y: [0, 80, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            style={{ position: 'absolute', bottom: '20%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'var(--secondary-glow)' }}
                            animate={{ x: [0, -60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />
                    </div>

                    {/* Logo Section */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3, ease: [0, 0.55, 0.45, 1] }}
                        style={{ textAlign: 'center', zIndex: 1 }}
                    >
                        <Logo size={140} />

                        <motion.h1
                            initial={{ opacity: 0, letterSpacing: '0.4em' }}
                            animate={{ opacity: 1, letterSpacing: '0.15em' }}
                            transition={{ duration: 1.2, delay: 1.2 }}
                            style={{
                                marginTop: 40,
                                fontSize: 40,
                                fontWeight: 800,
                                color: 'white',
                                fontFamily: 'var(--font-display)',
                                textTransform: 'uppercase'
                            }}
                        >
                            KARE-ATT
                        </motion.h1>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.5, delay: 1.8, ease: "circOut" }}
                            style={{
                                height: 1,
                                background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                                margin: '20px auto',
                                width: 180,
                                opacity: 0.6
                            }}
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ duration: 1, delay: 2.4 }}
                            style={{
                                fontSize: 13,
                                color: 'var(--text-muted)',
                                letterSpacing: '0.1em',
                                fontFamily: 'var(--font-mono)',
                                textTransform: 'uppercase'
                            }}
                        >
                            Intelligent Academic Hub
                        </motion.p>
                    </motion.div>

                    {/* Bottom Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 3 }}
                        style={{
                            position: 'absolute',
                            bottom: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16
                        }}
                    >
                        <div className="loader" style={{ width: 24, height: 24, borderWidth: 2 }} />
                        <span style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            opacity: 0.4,
                            fontFamily: 'var(--font-mono)'
                        }}>
                            Initializing System
                        </span>
                    </motion.div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .splash-container::before {
                            content: "";
                            position: absolute;
                            inset: 0;
                            background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
                            background-size: 32px 32px;
                            mask-image: radial-gradient(circle at 50% 50%, black, transparent 80%);
                        }
                    `}} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
