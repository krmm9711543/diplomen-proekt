import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../utils/translations';
import { LogIn, KeyRound, User, UserPlus } from 'lucide-react';
import { getApiUrl } from '../utils/api';


const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { language, setLanguage } = useUI();
    const t = useTranslation(language);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(getApiUrl(endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'USER' }), // default to user on reg
            });


            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || (isLogin ? t('loginFailed') : t('registrationFailed')));
            }

            if (!isLogin) {
                // If registered successfully, automatically log them in
                const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const loginData = await loginResponse.json();
                login(loginData.token, loginData.user);
                navigate('/');
            } else {
                login(data.token, data.user);
                navigate('/');
            }

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            position: 'relative'
        }}>
            {/* Language Switcher */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => setLanguage('en')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: language === 'en' ? 'var(--accent-color)' : 'var(--indicator-bg)',
                        color: language === 'en' ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer'
                    }}
                >
                    EN
                </button>
                <button
                    onClick={() => setLanguage('bg')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: language === 'bg' ? 'var(--accent-color)' : 'var(--indicator-bg)',
                        color: language === 'bg' ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer'
                    }}
                >
                    BG
                </button>
            </div>
            <div className="glass-panel animate-fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                animationDuration: '0.6s'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        marginBottom: '1rem'
                    }}>
                        {isLogin ? <LogIn size={32} color="var(--accent-color)" /> : <UserPlus size={32} color="var(--accent-color)" />}
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {isLogin ? t('welcomeBack') : t('createAccount')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {isLogin ? t('signInDesc') : t('registerDesc')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--danger-color)',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '4px',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                }}>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(true); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            backgroundColor: isLogin ? 'var(--card-bg)' : 'transparent',
                            color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            fontWeight: isLogin ? 600 : 500,
                            boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}>
                        {t('signIn')}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(false); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            backgroundColor: !isLogin ? 'var(--card-bg)' : 'transparent',
                            color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            fontWeight: !isLogin ? 600 : 500,
                            boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}>
                        {t('register')}
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">{t('username')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                <User size={18} />
                            </div>
                            <input
                                id="username"
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder={t('enterUsername')}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" htmlFor="password">{t('password')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                <KeyRound size={18} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem' }}
                        disabled={isLoading}
                    >
                        {isLoading ? t('processing') : (isLogin ? t('signIn') : t('createAccount'))}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
