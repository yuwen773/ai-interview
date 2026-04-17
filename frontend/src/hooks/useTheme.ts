import {useEffect, useState} from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // 优先读取 localStorage，未设置时默认深色模式
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) {
            return stored;
        }
        return 'dark';
    });

    // 同步到 document 和 localStorage
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 切换主题
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return {theme, toggleTheme};
}
