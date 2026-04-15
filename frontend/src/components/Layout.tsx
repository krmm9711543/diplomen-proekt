import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Home, Settings, SlidersHorizontal, ShieldAlert, Shield, Camera, X, User } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { useUI } from '../context/UIContext';
import { getApiUrl } from '../utils/api';





const Layout: React.FC = () => {
    const { user, token, logout, updateUser } = useAuth();
    const { language } = useUI();
    const t = useTranslation(language);
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Load avatar from server on mount to ensure it's up to date
    useEffect(() => {
        if (!token || user?.avatar) return; // Only fetch if we don't have it in local state (prevent flicker)
        fetch(getApiUrl("/api/users/me"), { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.avatar) updateUser({ avatar: data.avatar }); })
            .catch(() => {});
    }, [token, user?.avatar, updateUser]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        if (profileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profileMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target?.result as string;
            updateUser({ avatar: base64 });
            // Save to server
            fetch(getApiUrl("/api/users/me/avatar"), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ avatar: base64 })
            }).catch(() => {});
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = async () => {
        updateUser({ avatar: null });
        fetch(getApiUrl("/api/users/me/avatar"), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatar: null })
        }).catch(() => {});
    };

    const navItemStyle = (isActive: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        transition: 'all 0.2s',
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        border: '1px solid transparent',
        borderColor: isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent'
    });

    const AvatarBubble = ({ size = 40, fontSize = '1rem' }: { size?: number; fontSize?: string }) => (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: user?.avatar ? 'transparent' : 'rgba(59, 130, 246, 0.2)',
            color: 'var(--accent-color)', fontWeight: 700, fontSize,
            border: '2px solid rgba(59,130,246,0.25)'
        }}>
            {user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.username.charAt(0).toUpperCase()
            }
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside className="glass-panel" style={{
                width: '260px',
                margin: '1rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: '1rem',
                height: 'calc(100vh - 2rem)',
                overflowY: 'auto',
                zIndex: 10
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
                        borderRadius: '12px',
                        padding: '8px',
                        display: 'flex',
                        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Home size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        SmartPanel
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavLink to="/" end style={({ isActive }) => navItemStyle(isActive)}>
                        <LayoutDashboard size={20} />
                        {t('dashboard')}
                    </NavLink>
                    <NavLink to="/devices" style={({ isActive }) => navItemStyle(isActive)}>
                        <Settings size={20} />
                        {t('deviceManager')}
                    </NavLink>
                    <NavLink to="/settings" style={({ isActive }) => navItemStyle(isActive)}>
                        <SlidersHorizontal size={20} />
                        {t('settings')}
                    </NavLink>
                </nav>

                {/* User Section */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', position: 'relative' }} ref={menuRef}>

                    {/* Profile Popup Menu */}
                    {profileMenuOpen && (
                        <div style={{
                            position: 'absolute', bottom: 'calc(100% + 0.5rem)', left: '0.75rem', right: '0.75rem',
                            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                            borderRadius: '1rem', padding: '1rem',
                            boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            zIndex: 200, animation: 'fadeSlideUp 0.15s ease'
                        }}>
                            {/* Avatar preview */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <AvatarBubble size={72} fontSize="1.75rem" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        title={language === 'bg' ? 'Смени снимка' : 'Change photo'}
                                        style={{
                                            position: 'absolute', bottom: -2, right: -2,
                                            width: 26, height: 26, borderRadius: '50%',
                                            background: 'var(--accent-color)', border: '2px solid var(--card-bg)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: 'white'
                                        }}
                                    >
                                        <Camera size={12} />
                                    </button>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.username}</div>
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: 700,
                                        padding: '0.15rem 0.5rem', borderRadius: '1rem', marginTop: '0.25rem',
                                        backgroundColor: user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(128,128,128,0.1)',
                                        color: user?.role === 'ADMIN' ? '#8b5cf6' : 'var(--text-secondary)',
                                        border: user?.role === 'ADMIN' ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--glass-border)',
                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                    }}>
                                        {user?.role === 'ADMIN' ? <ShieldAlert size={9} /> : <Shield size={9} />}
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: 0 }} />

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <button onClick={() => fileInputRef.current?.click()} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    padding: '0.6rem 0.75rem', borderRadius: '0.6rem', border: 'none',
                                    background: 'var(--indicator-bg)', color: 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}>
                                    <Camera size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                                    {language === 'bg' ? 'Смени профилна снимка' : 'Change profile photo'}
                                </button>
                                 {user?.avatar && (
                                    <button onClick={handleRemoveAvatar} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '0.6rem', border: 'none',
                                        background: 'rgba(239,68,68,0.08)', color: 'var(--danger-color)',
                                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                                        textAlign: 'left'
                                    }}>
                                        <X size={15} style={{ flexShrink: 0 }} />
                                        {language === 'bg' ? 'Премахни снимката' : 'Remove photo'}
                                    </button>
                                )}
                                <button onClick={() => { setProfileMenuOpen(false); handleLogout(); }} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    padding: '0.6rem 0.75rem', borderRadius: '0.6rem', border: 'none',
                                    background: 'rgba(239,68,68,0.08)', color: 'var(--danger-color)',
                                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}>
                                    <LogOut size={15} style={{ flexShrink: 0 }} />
                                    {t('logout')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Clickable user row */}
                    <button
                        onClick={() => setProfileMenuOpen(v => !v)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 0.75rem', borderRadius: '0.75rem', border: 'none',
                            background: profileMenuOpen ? 'var(--indicator-bg)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '0.6rem'
                        }}
                    >
                        <AvatarBubble />
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                                    borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                    backgroundColor: user?.role === 'ADMIN' ? 'rgba(139,92,246,0.15)' : 'rgba(128,128,128,0.1)',
                                    color: user?.role === 'ADMIN' ? '#8b5cf6' : 'var(--text-secondary)',
                                    border: user?.role === 'ADMIN' ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--glass-border)'
                                }}>
                                    {user?.role === 'ADMIN' ? <ShieldAlert size={9} /> : <Shield size={9} />}
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                        <User size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="btn btn-danger"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                        <LogOut size={16} />
                        {t('logout')}
                    </button>

                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                padding: '1rem 2rem 1rem 0',
                display: 'flex',
                gap: '2rem'
            }}>
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    position: 'relative',
                }}>
                    <Outlet />
                </div>
            </main>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Layout;
