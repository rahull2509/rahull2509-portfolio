'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import './Hero.css';

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-bg-pattern"></div>
            <div className="container hero-inner">
                <div className="hero-grid">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        className="hero-content fm-initial"
                    >
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Available for opportunities
                        </div>

                        <h1 className="hero-name" style={{ marginTop: '20px' }}>
                            Rahul Gangwar<span className="name-dash">--</span>
                        </h1>

                        <h2 className="hero-title" style={{ fontSize: 'clamp(36px, 10vw, 84px)', lineHeight: '1.1' }}>
                            <span className="title-word">Full-Stack</span> <br />
                            <span className="title-word highlight">Developer</span>
                        </h2>

                        <p className="hero-description">
                            Full-Stack Developer with experience across React.js, Next.js, Node.js, TypeScript, Python, MongoDB, and PostgreSQL. I build scalable products, real-time systems, secure APIs, and responsive interfaces.
                        </p>

                        <div className="hero-actions">
                            <a
                                href="/Resume.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                download
                            >
                                VIEW RESUME
                            </a>
                        </div>
                    </motion.div>

                    {/* Right Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="hero-visual fm-initial"
                    >
                        <div className="hero-image-wrapper">
                            <Image
                                src="/customization-right.png"
                                alt="Developer Illustration"
                                className="hero-illustration"
                                width={500}
                                height={500}
                                priority
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="scroll-indicator fm-initial"
                >
                    <span>Scroll Down</span>
                    <div className="scroll-arrow"></div>
                </motion.div>
            </div>
        </section>
    );
}
