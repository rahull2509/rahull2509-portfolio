'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import { Mail, MapPin, Send, Github, Linkedin, Phone, Twitter } from 'lucide-react';
import './Contact.css';

export default function Contact() {
    const [ref, inView] = useInView();
    const [formState, setFormState] = useState({ status: 'idle', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormState({ status: 'loading', message: '' });

        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (res.ok) {
                setFormState({ status: 'success', message: result.message || 'Message sent!' });
                e.target.reset();
            } else {
                setFormState({ status: 'error', message: result.error || 'Failed to send' });
            }
        } catch {
            setFormState({ status: 'error', message: 'Network error. Please try again.' });
        }
    };

    return (
        <section id="contact" className="section contact-section" ref={ref}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">Get In Touch</div>
                    <h2 className="section-title">
                        Let&apos;s Work <span className="grad-text">Together</span>
                    </h2>
                    <p className="section-desc">
                        Have a project in mind? Let&apos;s discuss how I can help bring your ideas to life.
                    </p>
                </motion.div>

                <div className="contact-content">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="contact-form-wrapper fm-initial"
                    >
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    placeholder="What's this about?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    placeholder="Tell me about your project..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary submit-btn"
                                disabled={formState.status === 'loading'}
                            >
                                <Send size={18} />
                                {formState.status === 'loading' ? 'Sending...' : 'Send Message'}
                            </button>
                            {formState.status === 'success' && (
                                <p style={{ color: '#10b981', marginTop: '12px', fontWeight: 500 }}>
                                    ✓ {formState.message}
                                </p>
                            )}
                            {formState.status === 'error' && (
                                <p style={{ color: '#ef4444', marginTop: '12px', fontWeight: 500 }}>
                                    ✗ {formState.message}
                                </p>
                            )}
                        </form>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="contact-info fm-initial"
                    >
                        <div className="info-card">
                            <h3 className="info-title">Contact Information</h3>
                            <p className="info-subtitle">Feel free to reach out through any of these channels</p>

                            <div className="info-items">
                                <a href="mailto:rahulgangwar2625@gmail.com" className="info-item">
                                    <div className="info-icon">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <div className="info-label">Email</div>
                                        <div className="info-value">rahulgangwar2625@gmail.com</div>
                                    </div>
                                </a>

                                {/* <a href="tel:+9199XXXXXXXX" className="info-item">
                                    <div className="info-icon">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <div className="info-label">Phone</div>
                                        <div className="info-value">+91 99XXXXXXXX</div>
                                    </div>
                                </a> */}

                                <div className="info-item">
                                    <div className="info-icon">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <div className="info-label">Location</div>
                                        <div className="info-value">Bareilly, India</div>
                                    </div>
                                </div>
                            </div>

                            <div className="info-divider"></div>

                            <div className="social-links">
                                <p className="social-title">Connect With Me</p>
                                <div className="social-buttons">
                                    <a href="https://github.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-btn">
                                        <Github size={20} />
                                        <span>GitHub</span>
                                    </a>
                                    <a href="https://www.linkedin.com/in/rahullgangwar" target="_blank" rel="noopener noreferrer" className="social-btn">
                                        <Linkedin size={20} />
                                        <span>LinkedIn</span>
                                    </a>
                                    <a href="https://x.com/rahull2509" target="_blank" rel="noopener noreferrer" className="social-btn">
                                        <Twitter size={20} />
                                        <span>X</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
