import { useState, useId } from 'react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';
import { checkPwnedPassword } from '../utils/cryptoUtils';

export default function PasswordDiagnosis({ password, setPassword, onSwitchToGenerator }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [pwnedResult, setPwnedResult] = useState(null);
  const [pwnedError, setPwnedError] = useState(null);
  const passwordInputId = useId();

  const strength = evaluatePasswordStrength(password);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // 비밀번호가 바뀌면 이전 유출 검사 결과 리셋
    setPwnedResult(null);
    setPwnedError(null);
  };

  const handleCheckPwned = async () => {
    if (!password) {
      setPwnedError('비밀번호를 먼저 입력해 주세요.');
      return;
    }

    setIsCheckingPwned(true);
    setPwnedError(null);
    setPwnedResult(null);

    try {
      const result = await checkPwnedPassword(password);
      setPwnedResult(result);
    } catch (err) {
      setPwnedError(err.message || '유출 확인 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsCheckingPwned(false);
    }
  };

  const samplePasswords = [
    { label: 'password (유출 대표)', val: 'password' },
    { label: '123456 (초위험)', val: '123456' },
    { label: 'P@ssw0rd2026! (복합패턴)', val: 'P@ssw0rd2026!' },
    { label: 'xK9#mQ2$vL8@pW4! (랜덤보안)', val: 'xK9#mQ2$vL8@pW4!' },
  ];

  return (
    <div className="card-container">
      <div className="section-header">
        <h2>🛡️ 비밀번호 보안 진단 & k-익명성 유출 확인</h2>
        <p className="subtitle">
          비밀번호 원문은 서버로 전송되지 않으며, 모든 강도 분석과 해시 대조는 브라우저 내부에서만 안전하게 실행됩니다.
        </p>
      </div>

      {/* 빠른 테스트용 샘플 버튼 */}
      <div className="sample-chips">
        <span className="sample-label">테스트용 예시:</span>
        {samplePasswords.map((item) => (
          <button
            key={item.label}
            type="button"
            className="chip-btn"
            onClick={() => {
              setPassword(item.val);
              setPwnedResult(null);
              setPwnedError(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 비밀번호 입력 필드 */}
      <div className="input-group">
        <label htmlFor={passwordInputId} className="input-label">검사할 비밀번호 입력</label>
        <div className="input-wrapper">
          <input
            id={passwordInputId}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="비밀번호를 입력하여 강도 및 유출 여부를 점검하세요..."
            className="main-input"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="toggle-visibility-btn"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? '🙈 숨기기' : '👁️ 보기'}
          </button>
        </div>
      </div>

      {/* 강도 게이지 바 */}
      {password && (
        <div className="strength-section">
          <div className="strength-header">
            <span className="strength-title">보안 강도:</span>
            <span
              className="strength-badge"
              style={{ backgroundColor: `${strength.color}22`, color: strength.color, borderColor: strength.color }}
            >
              {strength.label} ({strength.score} / 5)
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(Math.max(strength.score, 0.5) / 5) * 100}%`,
                backgroundColor: strength.color,
                boxShadow: `0 0 12px ${strength.color}88`,
              }}
            />
          </div>

          {/* 핵심 지표 그리드 */}
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-name">글자 수</span>
              <span className="metric-val">{password.length}자</span>
            </div>
            <div className="metric-box">
              <span className="metric-name">문자 다양성 풀</span>
              <span className="metric-val">{strength.poolSize}종류</span>
            </div>
            <div className="metric-box">
              <span className="metric-name">정보 엔트로피</span>
              <span className="metric-val">{strength.entropy} bit</span>
            </div>
            <div className="metric-box">
              <span className="metric-name">예상 해독 시간</span>
              <span className="metric-val highlight">{strength.crackTime}</span>
            </div>
          </div>

          {/* 취약 패턴 경고 */}
          {strength.warnings.length > 0 && (
            <div className="alert-warning">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>취약점 발견!</strong>
                <ul>
                  {strength.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 체크리스트 */}
          <div className="checklist-grid">
            <div className={`check-item ${strength.checks.length12 ? 'passed' : 'failed'}`}>
              <span className="check-icon">{strength.checks.length12 ? '✓' : '✗'}</span>
              <span>12자 이상 권장 (현재: {password.length}자)</span>
            </div>
            <div className={`check-item ${strength.checks.hasUpper ? 'passed' : 'failed'}`}>
              <span className="check-icon">{strength.checks.hasUpper ? '✓' : '✗'}</span>
              <span>대문자 포함 (A-Z)</span>
            </div>
            <div className={`check-item ${strength.checks.hasLower ? 'passed' : 'failed'}`}>
              <span className="check-icon">{strength.checks.hasLower ? '✓' : '✗'}</span>
              <span>소문자 포함 (a-z)</span>
            </div>
            <div className={`check-item ${strength.checks.hasNumber ? 'passed' : 'failed'}`}>
              <span className="check-icon">{strength.checks.hasNumber ? '✓' : '✗'}</span>
              <span>숫자 포함 (0-9)</span>
            </div>
            <div className={`check-item ${strength.checks.hasSymbol ? 'passed' : 'failed'}`}>
              <span className="check-icon">{strength.checks.hasSymbol ? '✓' : '✗'}</span>
              <span>특수문자 포함 (!@#$%^...)</span>
            </div>
          </div>
        </div>
      )}

      {/* k-익명성 유출 확인 액션 영역 */}
      <div className="pwned-action-box">
        <div className="pwned-intro">
          <h3>🔍 Have I Been Pwned 유출 이력 검사 (k-익명성)</h3>
          <p>
            약 10억 건 이상의 실제 해킹 유출 데이터베이스와 대조합니다.
            단 한 글자의 비밀번호도 전송하지 않고 <strong>SHA-1 해시 앞 5자리만 전송</strong>하는
            k-익명성 기법으로 안전하게 조회합니다.
          </p>
        </div>

        <button
          type="button"
          className="btn-pwned-check"
          disabled={!password || isCheckingPwned}
          onClick={handleCheckPwned}
        >
          {isCheckingPwned ? (
            <span className="spinner-wrap">
              <span className="spinner"></span> SHA-1 계산 및 k-익명성 조회 중...
            </span>
          ) : (
            '🚀 이 비밀번호 유출 여부 확인하기'
          )}
        </button>

        {pwnedError && (
          <div className="alert-error">
            <span>❌</span> {pwnedError}
          </div>
        )}

        {/* 유출 검사 결과 카드 */}
        {pwnedResult && (
          <div className={`pwned-result-card ${pwnedResult.leaked ? 'leaked' : 'safe'}`}>
            <div className="result-status-header">
              <span className="status-icon">{pwnedResult.leaked ? '🚨' : '🛡️'}</span>
              <div className="status-texts">
                <h4>
                  {pwnedResult.leaked
                    ? `유출 사고에서 ${pwnedResult.count.toLocaleString()}회 발견되었습니다!`
                    : '축하합니다! 유출 이력이 발견되지 않은 비밀번호입니다.'}
                </h4>
                <p>
                  {pwnedResult.leaked
                    ? '실제 데이터베이스 침해 사고에 노출된 비밀번호입니다. 공격자가 사전 대입(Credential Stuffing) 공격에 최우선으로 사용하는 문자열이므로 절대 실사용하지 마세요.'
                    : 'Have I Been Pwned의 수억 개 유출 목록에 포함되지 않았습니다. 다른 사이트와 중복 사용하지 않고 강도 기준을 충족한다면 안전합니다.'}
                </p>
              </div>
            </div>

            {/* k-익명성 작동 과정 시각화 (네트워크 탭 검증용) */}
            <div className="kanonymity-inspector">
              <div className="inspector-title">
                <span>📡 네트워크 검증: 실제로 전송된 데이터 분석</span>
                <span className="tag-safe-principle">최소 전송 원칙 준수</span>
              </div>

              <div className="hash-breakdown">
                <div className="hash-visual">
                  <div className="hash-part prefix-part">
                    <span className="part-label">서버 전송 (앞 5자리)</span>
                    <span className="part-code">{pwnedResult.prefix}</span>
                  </div>
                  <div className="hash-divider">+</div>
                  <div className="hash-part suffix-part">
                    <span className="part-label">브라우저 로컬 대조 (뒤 35자리, 비전송)</span>
                    <span className="part-code">{pwnedResult.suffix}</span>
                  </div>
                </div>
              </div>

              <div className="network-detail-box">
                <div className="network-row">
                  <span className="net-key">실제 요청 URL:</span>
                  <code className="net-url">{pwnedResult.requestUrl}</code>
                </div>
                <div className="network-row">
                  <span className="net-key">서버 응답 후보군:</span>
                  <span className="net-val">
                    동일한 5글자 접두사를 가진 해시 {pwnedResult.totalRangeResults.toLocaleString()}개 수신 후 브라우저가 직접 대조
                  </span>
                </div>
                <div className="network-row">
                  <span className="net-key">적용 헤더:</span>
                  <code className="net-header">Add-Padding: true (더미 데이터를 통한 트래픽 크기 분석 차단)</code>
                </div>
              </div>

              <div className="inspector-footer">
                💡 <strong>브라우저 개발자 도구(F12) → Network 탭</strong>에서 
                <code>range/{pwnedResult.prefix}</code> 요청을 직접 확인해 보세요.
                비밀번호 원문이나 전체 해시는 어디에도 전송되지 않습니다.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 생성기 유도 배너 */}
      <div className="generator-callout">
        <div className="callout-text">
          <strong>더 강력하고 안전한 비밀번호가 필요하신가요?</strong>
          <span>Web Crypto API 기반의 암호학적으로 안전한 생성기를 사용해 보세요.</span>
        </div>
        <button
          type="button"
          className="btn-callout"
          onClick={onSwitchToGenerator}
        >
          🔑 안전한 비밀번호 생성하러 가기
        </button>
      </div>
    </div>
  );
}
