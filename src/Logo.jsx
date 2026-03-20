import { motion } from 'framer-motion';

export default function Logo({ size = 80, className = "", style = {} }) {
    return (
        <motion.div
            className={className}
            style={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                ...style
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%' }}
            >
                {/* Background Glow */}
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8885ff" />
                        <stop offset="100%" stopColor="#645efb" />
                    </linearGradient>
                </defs>

                {/* Outer Ring */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#logoGradient)"
                    strokeWidth="2"
                    strokeDasharray="280"
                    initial={{ strokeDashoffset: 280 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Stylized 'K' merged with a Checkmark */}
                <motion.path
                    d="M35 25V75M35 50L65 25M35 50L50 65L75 40"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
                    filter="url(#glow)"
                />
            </svg>
        </motion.div>
    );
}
