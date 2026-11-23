import { useState, useEffect } from 'react';
import PasswordDiagnosis from './components/PasswordDiagnosis';
import PasswordGenerator from './components/PasswordGenerator';
import CryptoVault from './components/CryptoVault';
import SecurityGuide from './components/SecurityGuide';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [currentPassword, setCurrentPassword] = useState('password');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shieldpass_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('shieldpass_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleApplyGeneratedPassword = (newPassword) => {
    setCurrentPassword(newPassword);
    setActiveTab('diagnosis');
  };

  return (
    <div className={`app-root ${theme === 'light' ? 'light-mode' : 'dark-mode'}`} data-theme={theme}>
      {/* 상단 사이버보안 헤더 */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-box">
            <div className="shield-logo">🛡️</div>
            <div>
              <h1 className="brand-title">ShieldPass 보안 도구</h1>
              <p className="brand-subtitle">
                Web Crypto API 기반 실시간 강도 분석 · k-익명성 유출 확인 · 영지식 금고
              </p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-badges">
              <span className="badge badge-sec">최소 전송 원칙 준수</span>
              <span className="badge badge-tech">Web Crypto API</span>
              <span className="badge badge-env">Client-Side Only</span>
            </div>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="화면 모드 전환"
            >
              {theme === 'dark' ? '☀️ 라이트' : '🌙 다크'}
            </button>
          </div>
        </div>
      </header>

      {/* 네비게이션 탭 */}
      <nav className="tab-nav">
        <div className="tab-container">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'diagnosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnosis')}
          >
            <span className="tab-icon">🛡️</span>
            <span>강도 진단 & 유출 확인</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <span className="tab-icon">🔑</span>
            <span>안전한 생성기</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            <span className="tab-icon">🔒</span>
            <span>AES-GCM 암호화 금고</span>
            <span className="tab-badge">확장</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <span className="tab-icon">📚</span>
            <span>k-익명성 원리 가이드</span>
          </button>
        </div>
      </nav>

      {/* 메인 탭 컨텐츠 */}
      <main className="main-content">
        {activeTab === 'diagnosis' && (
          <PasswordDiagnosis
            password={currentPassword}
            setPassword={setCurrentPassword}
            onSwitchToGenerator={() => setActiveTab('generator')}
          />
        )}

        {activeTab === 'generator' && (
          <PasswordGenerator onApplyToDiagnosis={handleApplyGeneratedPassword} />
        )}

        {activeTab === 'vault' && <CryptoVault />}

        {activeTab === 'guide' && <SecurityGuide />}
      </main>

      {/* 하단 푸터 */}
      <footer className="app-footer">
        <div className="footer-inner">
          <p>
            <strong>26-w12-password</strong> | 한국폴리텍대학 서울강서캠퍼스 사이버보안과
          </p>
          <p className="footer-note">
            🛡️ 보안 원칙: 입력된 모든 비밀번호는 브라우저 내부 메모리에서만 처리되며, 
            외부 서버로는 k-익명성 접두사(앞 5자리) 외에 어떤 정보도 전송하거나 로컬에 저장하지 않습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
