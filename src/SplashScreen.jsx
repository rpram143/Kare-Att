import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function SplashScreen({ show = true }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="splash-container"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #060e20 0%, #1a2540 100%)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Animated Background Orbs */}
                    <div className="bg-orbs" style={{ filter: 'blur(100px)', opacity: 0.3 }}>
                        <motion.div
                            style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: '#645efb' }}
                            animate={{ x: [0, 50, 0], y: [0, 100, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            style={{ position: 'absolute', bottom: '10%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: '#af88ff' }}
                            animate={{ x: [0, -70, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />
                    </div>

                    {/* Logo Section */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        style={{ textAlign: 'center', zIndex: 1 }}
                    >
                        <Logo size={180} />

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            style={{
                                marginTop: 24,
                                fontSize: 48,
                                fontWeight: 900,
                                letterSpacing: '0.12em',
                                color: 'white',
                                background: 'linear-gradient(to bottom, #ffffff, #a3aac4)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                        >
                            KARE-ATT
                        </motion.h1>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1, delay: 1.5, ease: "circOut" }}
                            style={{
                                height: 2,
                                background: 'linear-gradient(90deg, transparent, #8885ff, transparent)',
                                margin: '12px auto',
                                width: 140
                            }}
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 2 }}
                            style={{
                                fontSize: 14,
                                color: '#a3aac4',
                                letterSpacing: '0.05em',
                                fontWeight: 500
                            }}
                        >
                            The Academic Companion
                        </motion.p>
                    </motion.div>

                    {/* Footer Decoration */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ duration: 1, delay: 2.5 }}
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            fontSize: 11,
                            color: '#6d758c',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em'
                        }}
                    >
                        Efficiency Redefined
                    </motion.div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
            .splash-container::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image: radial-gradient(circle at 50% 50%, rgba(167, 165, 255, 0.05) 1px, transparent 1px);
              background-size: 24px 24px;
              opacity: 0.3;
              mask-image: linear-gradient(to bottom, transparent, black, transparent);
            }
          `}} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
