import { useRef, useState, useEffect } from 'react';

export function useInView(options = {}) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    const { threshold = 0.1, root = null, rootMargin = '0px' } = options;

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold, root, rootMargin }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold, root, rootMargin]);

    return [ref, inView];
}
