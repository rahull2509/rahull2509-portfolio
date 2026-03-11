'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import './Experience.css';

const experiences = [
    {
        company: 'VerifyDev (Startup Project)',
        role: 'Software Developer',
        location: 'Remote',
        period: 'Jan 2026 – Present',
        color: 'purple',
        bullets: [
            'Led migration of production application from React.js to Next.js, refactoring 200+ files to implement improved routing and architecture.',
            'Implemented modern rendering techniques including Server-Side Rendering (SSR) to enhance performance and SEO.',
            'Contributed 25+ merged pull requests with over 5000 lines of code, maintaining quality through peer code reviews.',
            'Collaborated with developers to fix production bugs and improve UI/UX across frontend repositories.',
            'Worked in an agile startup environment using Git workflows, feature branching, and continuous improvements.',
        ],
        tags: ['React.js', 'Next.js', 'Node.js', 'Git', 'SSR'],
    },
];

const colorMap = {
    purple: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', dot: '#8b5cf6' },
    cyan: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)', dot: '#06b6d4' },
};

export default function Experience() {
    return (
        <section id="experience" className="section exp-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">Work History</div>
                    <h2 className="section-title">
                        <span className="grad-text">Experience</span>
                    </h2>
                    <p className="section-desc">
                        Real-world impact building production web applications and contributing to startup growth.
                    </p>
                </motion.div>

                <div className="exp-timeline">
                    {experiences.map((exp, i) => {
                        const c = colorMap[exp.color];
                        return (
                            <motion.div
                                key={exp.company}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                className="exp-card glass fm-initial"
                            >
                                <div className="exp-dot" style={{ background: c.dot }} />
                                <div className="exp-body">
                                    <div className="exp-top">
                                        <div>
                                            <h3 className="exp-company">{exp.company}</h3>
                                            <div className="exp-role">{exp.role}</div>
                                        </div>
                                        <div className="exp-meta">
                                            <span className="exp-period">
                                                <Calendar size={13} /> {exp.period}
                                            </span>
                                            <span className="exp-location">
                                                <MapPin size={13} /> {exp.location}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="exp-bullets">
                                        {exp.bullets.map((b, bi) => (
                                            <li key={bi} className="exp-bullet">
                                                <ArrowRight size={14} className="bullet-icon" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="exp-tags">
                                        {exp.tags.map(t => (
                                            <span key={t} className="exp-tag" style={{ background: c.bg, borderColor: c.border }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Education */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="edu-card glass fm-initial"
                >
                    <div className="edu-icon">🎓</div>
                    <div className="edu-body">
                        <h3>Dr. A.P.J. Abdul Kalam Technical University</h3>
                        <p>Bachelor of Technology in Computer Science</p>
                        <div className="edu-meta">
                            <span><MapPin size={13} /> Lucknow, India</span>
                            <span><Calendar size={13} /> 2023 – 2027</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
