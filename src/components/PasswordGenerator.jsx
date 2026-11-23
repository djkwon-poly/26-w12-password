import { useState, useEffect } from 'react';
import { generateSecurePassword } from '../utils/cryptoUtils';

export default function PasswordGenerator({ onApplyToDiagnosis }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // 설정 변경 시 자동 재성성
  useEffect(() => {
    handleGenerate();
  }, [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  const handleGenerate = () => {
    const pw = generateSecurePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    });
    setGeneratedPassword(pw);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사 권한 오류 fallback
      const textArea = document.createElement('textarea');
      textArea.value = generatedPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (generatedPassword && onApplyToDiagnosis) {
      onApplyToDiagnosis(generatedPassword);
    }
  };

  // 문자 종류별 색상 하이라이트 렌더러
  const renderStyledPassword = () => {
    return generatedPassword.split('').map((char, index) => {
      let className = 'char-other';
      if (/[A-Z]/.test(char)) className = 'char-upper';
      else if (/[a-z]/.test(char)) className = 'char-lower';
      else if (/[0-9]/.test(char)) className = 'char-num';
      else className = 'char-sym';

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="card-container">
      <div className="section-header">
        <h2>🔑 안전한 난수 기반 비밀번호 생성기</h2>
        <p className="subtitle">
          소프트웨어적 난수(<code>Math.random()</code>) 대신 운영체제 엔트로피 풀을 직접 참조하는{' '}
          <strong><code>crypto.getRandomValues()</code></strong>를 사용하여 예측 불가능한 비밀번호를 생성합니다.
        </p>
      </div>

      {/* 생성된 비밀번호 표시창 */}
      <div className="generated-display-box">
        <div className="password-output">
          {generatedPassword ? renderStyledPassword() : '설정을 선택하세요'}
        </div>
        <div className="display-actions">
          <button
            type="button"
            className="btn-action btn-refresh"
            onClick={handleGenerate}
            title="새 비밀번호 다시 생성"
          >
            🔄 다시 생성
          </button>
          <button
            type="button"
            className={`btn-action btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✅ 복사됨!' : '📋 복사'}
          </button>
        </div>
      </div>

      {/* 문자 종류 범례 */}
      <div className="char-legend">
        <span className="legend-item"><span className="dot dot-upper"></span> 대문자</span>
        <span className="legend-item"><span className="dot dot-lower"></span> 소문자</span>
        <span className="legend-item"><span className="dot dot-num"></span> 숫자</span>
        <span className="legend-item"><span className="dot dot-sym"></span> 특수문자</span>
      </div>

      {/* 설정 옵션 컨트롤 */}
      <div className="controls-section">
        {/* 길이 슬라이더 */}
        <div className="control-row">
          <div className="slider-header">
            <span className="control-label">비밀번호 길이</span>
            <span className="slider-value-badge">{length}자</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="length-slider"
          />
          <div className="slider-labels">
            <span>8자 (최소)</span>
            <span>16자 (권장)</span>
            <span>32자 (고보안)</span>
            <span>64자 (최대)</span>
          </div>
        </div>

        {/* 체크박스 옵션 */}
        <div className="toggles-grid">
          <label className="toggle-card">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <div className="toggle-info">
              <span className="toggle-title">대문자 (A-Z)</span>
              <span className="toggle-desc">대문자 26종류 포함</span>
            </div>
          </label>

          <label className="toggle-card">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <div className="toggle-info">
              <span className="toggle-title">소문자 (a-z)</span>
              <span className="toggle-desc">소문자 26종류 포함</span>
            </div>
          </label>

          <label className="toggle-card">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <div className="toggle-info">
              <span className="toggle-title">숫자 (0-9)</span>
              <span className="toggle-desc">숫자 10종류 포함</span>
            </div>
          </label>

          <label className="toggle-card">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <div className="toggle-info">
              <span className="toggle-title">특수문자 (!@#$%^...)</span>
              <span className="toggle-desc">특수문자 27종류 포함</span>
            </div>
          </label>

          <label className="toggle-card full-width">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            />
            <div className="toggle-info">
              <span className="toggle-title">혼동하기 쉬운 문자 제외</span>
              <span className="toggle-desc">1, l, I, 0, O, | 등 눈으로 구분하기 힘든 문자를 제외합니다.</span>
            </div>
          </label>
        </div>
      </div>

      {/* 진단기로 전송 액션 버튼 */}
      <div className="generator-footer-actions">
        <button
          type="button"
          className="btn-send-to-diagnosis"
          onClick={handleApply}
        >
          🛡️ 생성된 비밀번호로 보안 진단 및 유출 검사하기 →
        </button>
      </div>

      {/* 보안 지식 카드 */}
      <div className="crypto-tip-card">
        <h4>🛡️ 사이버보안 체크포인트: 왜 Math.random()은 금지일까요?</h4>
        <p>
          자바스크립트의 <code>Math.random()</code>은 난수 생성 알고리즘(PRNG, 주로 xoshiro128**)을 사용하며,
          이전 출력값 몇 개만 알면 다음 생성될 난수를 수학적으로 역추산할 수 있습니다.
          반면 <strong><code>crypto.getRandomValues()</code></strong>는 하드웨어 엔트로피(마우스 움직임, CPU 타이머 노이즈 등)를
          기반으로 하는 암호학적 난수 생성기(CSPRNG)이므로 다음 값을 예측하는 것이 수학적으로 불가능합니다.
        </p>
      </div>
    </div>
  );
}
