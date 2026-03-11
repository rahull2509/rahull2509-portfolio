'use client';

import { Github, Linkedin, Mail, Heart, Lock, Twitter } from 'lucide-react';
import Link from 'next/link';
import './Footer.css';

const social = [
    { icon: Github, href: 'https://github.com/rahull2509', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/rahullgangwar', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://x.com/rahull2509', label: 'X' },
    { icon: Mail, href: 'mailto:rahulgangwar2625@gmail.com', label: 'Email' },
];

export default function Footer() {
    const scrollToSection = (id) => {
        const element = document.querySelector(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-top">
                    <div className="footer-brand">
                        <span className="footer-logo">Rahul Gangwar<span className="footer-dot">.</span></span>
                        <p className="footer-tagline">Full-Stack Developer | React & Next.js</p>
                    </div>
                    <div className="footer-social">
                        {social.map(({ icon: Icon, href, label }) => (
                            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="footer-social-link" title={label}>
                                <Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} Rahul Gangwar. Made with <Heart size={14} className="footer-heart" /> using React + Next.js</span>
                    <Link href="/admin" className="footer-admin-btn">
                        <Lock size={14} /> Admin
                    </Link>
                </div>
            </div>
        </footer>
    );
}
