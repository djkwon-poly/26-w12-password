/**
 * 비밀번호 강도 진단 및 취약점 분석 모듈
 * - 길이, 대소문자, 숫자, 특수문자 조합 검사
 * - 흔한 패턴(연속 키보드 배치, 반복 문자, 사전 비밀번호) 탐지
 * - 정보 엔트로피(Entropy bit) 계산 및 무차별 대입(Brute-force) 소요 시간 추정
 */

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '123456789', 'qwerty',
  'admin', 'welcome', 'login', 'iloveyou', '12345',
  '123123', 'sunshine', 'princess', 'football', 'monkey',
  'test', 'master', 'dragon', 'secret', 'password123'
]);

const KEYBOARD_PATTERNS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', '0987654321', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz'
];

/**
 * 비밀번호 취약 패턴 검사
 * @param {string} password 
 * @returns {string[]} 탐지된 취약점 경고 메시지 목록
 */
export function detectWeakPatterns(password) {
  const warnings = [];
  const lower = password.toLowerCase();

  // 1. 대표적인 유출 비밀번호 목록 대조
  if (COMMON_PASSWORDS.has(lower)) {
    warnings.push('널리 알려진 대표 취약 비밀번호입니다.');
  }

  // 2. 키보드 연속 패턴 검사 (3글자 이상 연속)
  for (const pattern of KEYBOARD_PATTERNS) {
    for (let i = 0; i <= pattern.length - 3; i++) {
      const sub = pattern.slice(i, i + 3);
      if (lower.includes(sub)) {
        warnings.push(`연속된 키보드 패턴("${sub}")이 포함되어 있습니다.`);
        break;
      }
    }
  }

  // 3. 동일 문자 3회 이상 반복 검사 (예: aaa, 111)
  if (/(.)\1\1/.test(password)) {
    warnings.push('동일한 문자가 3회 이상 반복되고 있습니다.');
  }

  // 4. 알파벳/숫자 단순 증가 패턴 (예: abc, 789)
  for (let i = 0; i < password.length - 2; i++) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    if (c2 === c1 + 1 && c3 === c2 + 1) {
      warnings.push(`연속 증가 문자("${password.slice(i, i + 3)}")가 감지되었습니다.`);
      break;
    }
  }

  // 중복 경고 제거
  return Array.from(new Set(warnings));
}

/**
 * 엔트로피 및 크랙 시간 계산
 * E = L * log2(R)
 * @param {string} password
 * @param {Object} characterSets
 * @returns {{ entropy: number, crackTime: string, poolSize: number }}
 */
export function calculateEntropyAndCrackTime(password, characterSets) {
  if (!password) {
    return { entropy: 0, crackTime: '0초', poolSize: 0 };
  }

  let poolSize = 0;
  if (characterSets.hasLower) poolSize += 26;
  if (characterSets.hasUpper) poolSize += 26;
  if (characterSets.hasNumber) poolSize += 10;
  if (characterSets.hasSymbol) poolSize += 33;

  if (poolSize === 0) poolSize = 1;

  // 비트 엔트로피
  const entropy = Math.round(password.length * Math.log2(poolSize));

  // 초당 100억 회(10^10) 추측 가능한 고성능 오프라인 크래킹 장비 기준
  const guessesPerSecond = 1e10;
  const totalCombinations = Math.pow(poolSize, password.length);
  const seconds = totalCombinations / (2 * guessesPerSecond);

  let crackTime = '즉시';
  if (seconds < 1) {
    crackTime = '즉시 (< 1초)';
  } else if (seconds < 60) {
    crackTime = `약 ${Math.round(seconds)}초`;
  } else if (seconds < 3600) {
    crackTime = `약 ${Math.round(seconds / 60)}분`;
  } else if (seconds < 86400) {
    crackTime = `약 ${Math.round(seconds / 3600)}시간`;
  } else if (seconds < 31536000) {
    crackTime = `약 ${Math.round(seconds / 86400)}일`;
  } else if (seconds < 31536000 * 100) {
    crackTime = `약 ${Math.round(seconds / 31536000)}년`;
  } else if (seconds < 31536000 * 1e6) {
    crackTime = `약 ${Math.round(seconds / (31536000 * 1000))}천 년`;
  } else {
    crackTime = '수억 년 이상 (현존 장비로 해독 불가)';
  }

  return { entropy, crackTime, poolSize };
}

/**
 * 비밀번호 강도 종합 평가
 * @param {string} password
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '입력 대기',
      color: '#6b7280',
      checks: {
        length8: false,
        length12: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSymbol: false,
      },
      warnings: [],
      entropy: 0,
      crackTime: '0초',
      poolSize: 0,
    };
  }

  const length8 = password.length >= 8;
  const length12 = password.length >= 12;
  const length16 = password.length >= 16;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const checks = {
    length8,
    length12,
    length16,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
  };

  const warnings = detectWeakPatterns(password);
  const { entropy, crackTime, poolSize } = calculateEntropyAndCrackTime(password, checks);

  // 점수 계산 (0 ~ 5)
  let score = 0;
  if (length8) score += 1;
  if (length12) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;

  // 취약 패턴 존재 시 감점
  if (warnings.length > 0) {
    score = Math.max(1, score - warnings.length);
  }

  const levels = [
    { label: '매우 위험', color: '#ef4444' }, // 0
    { label: '취약함', color: '#f97316' },   // 1
    { label: '보통', color: '#eab308' },     // 2
    { label: '안전함', color: '#10b981' },   // 3
    { label: '매우 안전', color: '#06b6d4' }, // 4
    { label: '최고 보안', color: '#8b5cf6' }, // 5
  ];

  const currentLevel = levels[Math.min(score, 5)];

  return {
    score,
    label: currentLevel.label,
    color: currentLevel.color,
    checks,
    warnings,
    entropy,
    crackTime,
    poolSize,
  };
}
