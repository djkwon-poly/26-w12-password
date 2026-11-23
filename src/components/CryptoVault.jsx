import { useState } from 'react';
import { encryptWithVault, decryptWithVault } from '../utils/cryptoUtils';

export default function CryptoVault() {
  const [memo, setMemo] = useState('비밀 금고에 보관할 민감한 개인정보입니다.');
  const [masterPassword, setMasterPassword] = useState('');
  const [envelope, setEnvelope] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedMemo, setDecryptedMemo] = useState(null);
  const [vaultError, setVaultError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEncrypt = async () => {
    if (!memo || !masterPassword) {
      setVaultError('보관할 메모와 마스터 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setVaultError(null);
    setDecryptedMemo(null);
    setIsProcessing(true);

    try {
      const res = await encryptWithVault(memo, masterPassword);
      setEnvelope(res);
      setDecryptPassword('');
    } catch (err) {
      setVaultError(err.message || '암호화 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!envelope || !decryptPassword) {
      setVaultError('암호화된 데이터와 복호화용 비밀번호를 입력해 주세요.');
      return;
    }

    setVaultError(null);
    setIsProcessing(true);

    try {
      const plain = await decryptWithVault(envelope, decryptPassword);
      setDecryptedMemo(plain);
    } catch {
      setVaultError('❌ 복호화 실패! 비밀번호가 틀렸거나 데이터가 위변조되었습니다. (AES-GCM 무결성 검증 실패)');
      setDecryptedMemo(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card-container">
      <div className="section-header">
        <h2>🔒 [보너스 확장 기능] 영지식 AES-256-GCM 비밀 금고</h2>
        <p className="subtitle">
          비밀번호로부터 <strong>PBKDF2(100,000회 반복 연산)</strong>로 암호화 키를 유도하고,
          <strong>AES-256-GCM</strong> 인증 암호화로 메모를 보호합니다.
          비밀번호를 잃어버리면 복구가 불가능한 영지식(Zero-Knowledge) 원리를 직접 체험해 보세요.
        </p>
      </div>

      <div className="vault-columns">
        {/* 암호화 영역 */}
        <div className="vault-panel">
          <div className="panel-title">
            <span>🔐 1단계: 메모 암호화</span>
          </div>

          <div className="input-group">
            <label className="input-label">보관할 비밀 메모</label>
            <textarea
              className="vault-textarea"
              rows="3"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="암호화할 비밀 메모를 입력하세요..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">암호화용 마스터 비밀번호</label>
            <input
              type="password"
              className="main-input"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="마스터 비밀번호 설정"
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleEncrypt}
            disabled={isProcessing}
          >
            {isProcessing ? 'PBKDF2 키 유도 중...' : '🔒 안전하게 암호화하기'}
          </button>
        </div>

        {/* 복호화 영역 */}
        <div className="vault-panel">
          <div className="panel-title">
            <span>🔓 2단계: 복호화 테스트</span>
          </div>

          {envelope ? (
            <>
              <div className="cipher-preview-box">
                <span className="cipher-label">생성된 암호문 패키지:</span>
                <div className="code-block">
                  <div><strong>Salt (16B):</strong> {envelope.salt.slice(0, 16)}...</div>
                  <div><strong>IV (12B):</strong> {envelope.iv}</div>
                  <div><strong>Ciphertext:</strong> {envelope.ciphertext.slice(0, 24)}...</div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">복호화용 비밀번호 입력</label>
                <input
                  type="password"
                  className="main-input"
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  placeholder="암호화할 때 쓴 비밀번호 입력 (오타 테스트 가능)"
                />
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDecrypt}
                disabled={isProcessing}
              >
                {isProcessing ? '검증 및 복호화 중...' : '🔓 복호화 실행'}
              </button>

              {decryptedMemo && (
                <div className="alert-success">
                  <strong>🎉 복호화 성공!</strong>
                  <p className="decrypted-text">{decryptedMemo}</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-vault-state">
              <span>👈 왼쪽에서 메모와 마스터 비밀번호를 입력하고 암호화를 먼저 진행해 주세요.</span>
            </div>
          )}
        </div>
      </div>

      {vaultError && (
        <div className="alert-error" style={{ marginTop: '1rem' }}>
          {vaultError}
        </div>
      )}

      {/* 보안 교육 가이드 */}
      <div className="crypto-tip-card" style={{ marginTop: '1.5rem' }}>
        <h4>💡 왜 마스터 비밀번호를 잊으면 개발자도 복구할 수 없을까요?</h4>
        <p>
          이 금고는 서버나 데이터베이스에 어떤 키나 복원 수단도 저장하지 않는 <strong>영지식(Zero-Knowledge)</strong> 아키텍처입니다.
          비밀번호가 단 1글자만 틀려도 PBKDF2에 의해 완전히 다른 암호화 키가 유도되며,
          AES-GCM 알고리즘의 <strong>인증 태그(Auth Tag)</strong> 무결성 검증에서 즉시 차단됩니다.
        </p>
      </div>
    </div>
  );
}
