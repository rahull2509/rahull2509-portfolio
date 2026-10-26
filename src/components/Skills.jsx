'use client';

import { motion } from 'framer-motion';
import './Skills.css';

const skillGroups = [
    {
        label: 'Languages',
        icon: '⚡',
        color: 'purple',
        skills: ['TypeScript', 'JavaScript', 'C', 'C++', 'HTML5', 'CSS3', 'SQL'],
    },
    {
        label: 'Frontend',
        icon: '🎨',
        color: 'cyan',
        skills: ['React.js', 'Next.js', 'Redux', 'Zustand', 'Tailwind CSS', 'Framer Motion', 'TanStack Query/Table/Virtual', 'Responsive Web Design', 'Browser APIs'],
    },
    {
        label: 'Backend',
        icon: '🖥',
        color: 'pink',
        skills: ['Node.js', 'Express.js', 'Python', 'FastAPI', 'REST APIs', 'WebSockets', 'Socket.io', 'JWT Authentication'],
    },
    {
        label: 'Databases',
        icon: '🗄',
        color: 'emerald',
        skills: ['MongoDB', 'PostgreSQL', 'Redis', 'DuckDB', 'Apache Parquet', 'PyArrow', 'AWS S3'],
    },
    {
        label: 'ORM / Data Layer',
        icon: '📦',
        color: 'orange',
        skills: ['Prisma ORM', 'Mongoose', 'SQLAlchemy', 'Pandas'],
    },
    {
        label: 'DevOps & Tools',
        icon: '☁️',
        color: 'purple',
        skills: ['Docker', 'Docker Compose', 'Kubernetes (K8s)', 'Git', 'GitHub', 'Linux', 'AWS EC2', 'Nginx', 'npm', 'VS Code'],
    },
    {
        label: 'Concepts & Deployment',
        icon: '🚀',
        color: 'emerald',
        skills: ['DSA', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'Authentication & Authorization', 'API Design', 'MVC Architecture', 'State Management', 'Vercel', 'Netlify', 'MongoDB Atlas'],
    },
];

const colorMap = {
    purple: 'rgba(249,115,22,0.07)',
    cyan: 'rgba(245,158,11,0.07)',
    pink: 'rgba(239,68,68,0.07)',
    emerald: 'rgba(16,185,129,0.07)',
    orange: 'rgba(249,115,22,0.07)',
};

const borderMap = {
    purple: 'rgba(249,115,22,0.2)',
    cyan: 'rgba(245,158,11,0.2)',
    pink: 'rgba(239,68,68,0.2)',
    emerald: 'rgba(16,185,129,0.2)',
    orange: 'rgba(249,115,22,0.2)',
};

export default function Skills() {
    return (
        <section id="skills" className="section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">Technical Skills</div>
                    <h2 className="section-title">
                        My <span className="grad-text">Stack</span>
                    </h2>
                    <p className="section-desc">
                        Technologies I use to build modern, scalable web applications.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="skills-single-div glass fm-initial"
                >
                    <div className="skills-content-wrapper">
                        {skillGroups.map((group) => (
                            <div key={group.label} className="skill-category">
                                <h3 className="skill-category-title">
                                    <span className="skill-category-icon">{group.icon}</span>
                                    {group.label}
                                </h3>
                                <div className="skill-tags">
                                    {group.skills.map(skill => (
                                        <span
                                            key={skill}
                                            className="skill-tag"
                                            style={{
                                                background: colorMap[group.color],
                                                borderColor: borderMap[group.color]
                                            }}
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
