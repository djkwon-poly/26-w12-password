/**
 * 사이버보안 원칙 준수 암호화 유틸리티 모듈
 * - Web Crypto API (crypto.subtle, crypto.getRandomValues) 활용
 * - Math.random() 사용 금지
 * - 비밀번호 console.log 및 localStorage 저장 금지
 */

/**
 * 텍스트의 SHA-1 해시를 대문자 40자리 16진수 문자열로 반환
 * @param {string} text
 * @returns {Promise<string>} 40자리 대문자 HEX 문자열
 */
export async function computeSha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * crypto.getRandomValues()를 사용한 안전한 난수 기반 비밀번호 생성
 * @param {Object} options
 * @param {number} options.length 비밀번호 길이 (8 ~ 64)
 * @param {boolean} options.uppercase 대문자 포함 여부
 * @param {boolean} options.lowercase 소문자 포함 여부
 * @param {boolean} options.numbers 숫자 포함 여부
 * @param {boolean} options.symbols 특수문자 포함 여부
 * @param {boolean} options.excludeAmbiguous 혼동하기 쉬운 문자(1, l, I, 0, O, |) 제외 여부
 * @returns {string} 생성된 비밀번호
 */
export function generateSecurePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
  excludeAmbiguous = false,
}) {
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (excludeAmbiguous) {
    const ambiguousRegex = /[1lI0O|]/g;
    upperChars = upperChars.replace(ambiguousRegex, '');
    lowerChars = lowerChars.replace(ambiguousRegex, '');
    numberChars = numberChars.replace(ambiguousRegex, '');
    symbolChars = symbolChars.replace(ambiguousRegex, '');
  }

  const selectedSets = [];
  let fullCharset = '';

  if (uppercase) {
    selectedSets.push(upperChars);
    fullCharset += upperChars;
  }
  if (lowercase) {
    selectedSets.push(lowerChars);
    fullCharset += lowerChars;
  }
  if (numbers) {
    selectedSets.push(numberChars);
    fullCharset += numberChars;
  }
  if (symbols) {
    selectedSets.push(symbolChars);
    fullCharset += symbolChars;
  }

  // 아무 문자셋도 선택하지 않은 경우 기본 소문자+숫자
  if (fullCharset.length === 0) {
    fullCharset = lowerChars + numberChars;
    selectedSets.push(lowerChars, numberChars);
  }

  // 편향(Modulo Bias)을 방지하는 난수 인덱스 추출 함수
  function getRandomCharFrom(charset) {
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % charset.length);
    const randomBuffer = new Uint32Array(1);

    while (true) {
      crypto.getRandomValues(randomBuffer);
      const val = randomBuffer[0];
      if (val < limit) {
        return charset[val % charset.length];
      }
    }
  }

  const passwordChars = [];

  // 1. 선택된 각 문자셋에서 최소 1글자씩 보장 추출
  for (const set of selectedSets) {
    if (passwordChars.length < length) {
      passwordChars.push(getRandomCharFrom(set));
    }
  }

  // 2. 남은 길이만큼 전체 문자셋에서 균등 추출
  while (passwordChars.length < length) {
    passwordChars.push(getRandomCharFrom(fullCharset));
  }

  // 3. Fisher-Yates 셔플 알고리즘으로 무작위 재배치 (crypto.getRandomValues 사용)
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

/**
 * Have I Been Pwned의 k-익명성 Range API를 사용한 비밀번호 유출 검사
 * - 비밀번호 원문은 절대 전송되지 않음
 * - SHA-1 해시의 앞 5글자(prefix)만 서버로 전송
 * - 뒤 35글자(suffix) 대조는 브라우저 내부에서 대문자 기준으로 수행
 * - Add-Padding: true 헤더를 적용하여 응답 크기 추론 방어 (0회 더미 필터링)
 * 
 * @param {string} password 검사할 비밀번호
 * @returns {Promise<{
 *   leaked: boolean,
 *   count: number,
 *   hash: string,
 *   prefix: string,
 *   suffix: string,
 *   requestUrl: string,
 *   totalRangeResults: number
 * }>}
 */
export async function checkPwnedPassword(password) {
  if (!password) {
    throw new Error('비밀번호를 입력해 주세요.');
  }

  // 1. 브라우저에서 SHA-1 해시 계산
  const fullHash = await computeSha1(password);
  const prefix = fullHash.slice(0, 5); // 서버로 전송할 앞 5글자
  const suffix = fullHash.slice(5);   // 브라우저에서만 대조할 뒤 35글자

  const requestUrl = `https://api.pwnedpasswords.com/range/${prefix}`;

  // 2. 앞 5글자만 외부 API로 전송 (Add-Padding 헤더 적용)
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true', // 가짜 레코드 섞어서 응답 크기 기반 추론 차단
    },
  });

  if (!response.ok) {
    throw new Error(`유출 확인 서버 응답 오류 (상태 코드: ${response.status})`);
  }

  const responseText = await response.text();
  const lines = responseText.split('\r\n');

  let matchCount = 0;
  let totalCandidates = 0;

  // 3. 브라우저 메모리 안에서 대문자 기준으로 대조
  for (const line of lines) {
    if (!line) continue;
    totalCandidates++;

    const [hashSuffix, countStr] = line.trim().split(':');
    const count = parseInt(countStr, 10);

    // Add-Padding으로 생성된 count: 0 가짜 레코드는 제외
    if (count > 0 && hashSuffix.toUpperCase() === suffix.toUpperCase()) {
      matchCount = count;
      break;
    }
  }

  return {
    leaked: matchCount > 0,
    count: matchCount,
    hash: fullHash,
    prefix,
    suffix,
    requestUrl,
    totalRangeResults: totalCandidates,
  };
}

/**
 * PBKDF2 키 유도 및 AES-256-GCM을 활용한 비밀 금고 암호화
 * @param {string} plaintext 평문 메시지
 * @param {string} masterPassword 마스터 비밀번호
 * @returns {Promise<{ salt: string, iv: string, ciphertext: string }>} Base64 인코딩된 암호문 객체
 */
export async function encryptWithVault(plaintext, masterPassword) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 마스터 비밀번호로 PBKDF2 키 생성
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintext)
  );

  const toBase64 = (arr) => btoa(String.fromCharCode(...new Uint8Array(arr)));

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(encryptedBuffer),
  };
}

/**
 * AES-256-GCM 복호화
 * @param {{ salt: string, iv: string, ciphertext: string }} envelope
 * @param {string} masterPassword
 * @returns {Promise<string>} 복호화된 평문
 */
export async function decryptWithVault(envelope, masterPassword) {
  const fromBase64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));

  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const encryptedBytes = fromBase64(envelope.ciphertext);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
