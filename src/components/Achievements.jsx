'use client';

import { motion } from 'framer-motion';
import { Award, BadgeCheck, Rocket, Users } from 'lucide-react';
import { createElement } from 'react';
import './Achievements.css';

const achievements = [
    {
        icon: Award,
        title: 'National Hackathon Finalist',
        description: 'Secured 5th rank at National Level FU Nexathon 2026 among 100+ teams by building a full-stack application within 8 hours.',
    },
    {
        icon: Rocket,
        title: '15+ Applications Built',
        description: 'Built and deployed more than 15 full-stack web applications using React.js, Next.js, Node.js, TypeScript, MongoDB, and PostgreSQL.',
    },
    {
        icon: Users,
        title: 'Collaborative Builder',
        description: 'Collaborated in teams of up to five members across project planning, feature implementation, reviews, and task management.',
    },
];

const certifications = [
    'Full Stack Development Internship Certificate · Internshala · Apr 2026',
    'Software Testing Internship Certificate · Internshala · Apr 2026',
];

export default function Achievements() {
    return (
        <section id="achievements" className="section achievements-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">Beyond the Code</div>
                    <h2 className="section-title">
                        Achievements & <span className="grad-text">Certifications</span>
                    </h2>
                    <p className="section-desc">
                        Milestones and credentials from my journey as a developer.
                    </p>
                </motion.div>

                <div className="achievement-grid">
                    {achievements.map(({ icon, title, description }, index) => (
                        <motion.article
                            key={title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="achievement-card glass fm-initial"
                        >
                            <div className="achievement-icon">{createElement(icon, { size: 22 })}</div>
                            <h3>{title}</h3>
                            <p>{description}</p>
                        </motion.article>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5 }}
                    className="certifications-card glass fm-initial"
                >
                    <div className="certifications-heading">
                        <BadgeCheck size={22} />
                        <h3>Certifications</h3>
                    </div>
                    <ul>
                        {certifications.map(certification => (
                            <li key={certification}>{certification}</li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </section>
    );
}
