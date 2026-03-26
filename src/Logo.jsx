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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%' }}
            >
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38debb" />
                        <stop offset="100%" stopColor="#4edea3" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Refined Geometric 'K' */}
                <motion.path
                    d="M25 20V80M25 50L65 20M35 55L75 80"
                    stroke="url(#logoGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    filter="url(#glow)"
                />

                {/* Accent Detail */}
                <motion.circle
                    cx="25"
                    cy="20"
                    r="4"
                    fill="white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                />
            </svg>
        </motion.div>
    );
}
