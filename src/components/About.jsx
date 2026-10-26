'use client';

import { motion } from 'framer-motion';
import { Code, Coffee, Heart, Zap } from 'lucide-react';
import './About.css';

const highlights = [
    {
        icon: Code,
        title: 'Full-Stack',
        description: 'Building scalable web apps with React.js, Next.js, Node.js & MongoDB'
    },
    {
        icon: Zap,
        title: 'React to Next.js',
        description: 'Led production migration refactoring 200+ files with SSR implementation'
    },
    {
        icon: Heart,
        title: 'REST APIs',
        description: 'Designing secure APIs with JWT authentication and CRUD operations'
    },
    {
        icon: Coffee,
        title: 'Clean Code',
        description: 'Passionate about maintainable code, state management & responsive design'
    }
];

export default function About() {
    return (
        <section id="about" className="section about-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">About Me</div>
                    <h2 className="section-title">
                        Building Modern <span className="grad-text">Web Apps</span>
                    </h2>
                    <p className="section-desc">
                        Full-stack developer building scalable products across frontend, backend, data, and deployment.
                    </p>
                </motion.div>

                <div className="about-content">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="about-image-wrapper fm-initial"
                    >
                        <div className="about-image-container">
                            <img 
                                src="/customization-left.webp" 
                                alt="Profile" 
                                className="about-image"
                            />
                            <div className="image-backdrop"></div>
                        </div>
                        <div className="about-badge">
                            <span className="badge-emoji">🚀</span>
                            <div>
                                <div className="badge-title">Available for Work</div>
                                <div className="badge-subtitle">Bareilly, India</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="about-text fm-initial"
                    >
                        <h3 className="about-heading">
                            About <span className="highlight-text">Me</span>
                        </h3>
                        
                        <div className="about-description">
                            <p>
                                Full-stack developer with hands-on experience building scalable web applications using React.js, Next.js, Node.js, TypeScript, MongoDB, and PostgreSQL.
                            </p>
                            <p>
                                Experienced in REST API development, authentication systems, real-time applications, Prisma ORM, database design, and modern deployment workflows. I enjoy solving real-world problems through reliable, responsive products.
                            </p>
                            <p>
                                Currently pursuing a B.Tech in Computer Science at Dr. A.P.J. Abdul Kalam Technical University, with a 7.15/10 CGPA. I have built and deployed 15+ full-stack applications and enjoy collaborating in agile teams.
                            </p>
                        </div>

                        <div className="about-highlights">
                            {highlights.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="highlight-card fm-initial"
                                >
                                    <div className="highlight-icon">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="highlight-title">{item.title}</h4>
                                        <p className="highlight-desc">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
