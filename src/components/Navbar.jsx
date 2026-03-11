'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Github, Linkedin, Mail, Twitter } from 'lucide-react';
import './Navbar.css';

const links = [
    { to: '#about', label: 'About' },
    { to: '#projects', label: 'Projects' },
    { to: '#contact', label: 'Contact' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    useEffect(() => { setMenuOpen(false); }, [pathname]);

    const scrollToSection = (id) => {
        if (id.startsWith('#')) {
            const element = document.querySelector(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setMenuOpen(false);
            }
        }
    };

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`navbar ${scrolled ? 'scrolled' : ''}`}
        >
            <div className="nav-inner">
                <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
                    <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: '500' }}>👋 Hi, I'm Rahul</span>
                </Link>

                <ul className="nav-links">
                    {links.map(l => (
                        <li key={l.to}>
                            <button
                                onClick={() => scrollToSection(l.to)}
                                className="nav-link"
                            >
                                {l.label}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="nav-actions">
                    <div className="nav-social">
                        <a href="https://github.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-link">
                            <Github size={18} />
                        </a>
                        <a href="https://www.linkedin.com/in/rahullgangwar" target="_blank" rel="noopener noreferrer" className="social-link">
                            <Linkedin size={18} />
                        </a>
                        <a href="mailto:rahulgangwar2625@gmail.com" className="social-link">
                            <Mail size={18} />
                        </a>
                        <a href="https://x.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-link">
                            <Twitter size={18} />
                        </a>
                    </div>
                    <button className="nav-menu-btn" onClick={() => setMenuOpen(v => !v)}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mobile-menu"
                    >
                        {links.map(l => (
                            <button
                                key={l.to}
                                onClick={() => scrollToSection(l.to)}
                                className="mobile-link"
                            >
                                {l.label}
                            </button>
                        ))}
                        <div className="mobile-social">
                            <a href="https://github.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-link">
                                <Github size={18} />
                            </a>
                            <a href="https://www.linkedin.com/in/rahullgangwar" target="_blank" rel="noopener noreferrer" className="social-link">
                                <Linkedin size={18} />
                            </a>
                            <a href="mailto:rahulgangwar2625@gmail.com" className="social-link">
                                <Mail size={18} />
                            </a>
                            <a href="https://x.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-link">
                                <Twitter size={18} />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
