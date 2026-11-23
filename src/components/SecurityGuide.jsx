export default function SecurityGuide() {
  return (
    <div className="card-container">
      <div className="section-header">
        <h2>📚 사이버보안 원리: k-익명성과 최소 전송 원칙</h2>
        <p className="subtitle">
          비밀번호를 외부 서버에 보내지 않고도 유출 여부를 확인할 수 있는 k-익명성 기술과 보안 원칙을 알아봅니다.
        </p>
      </div>

      <div className="guide-grid">
        {/* 원리 카드 1 */}
        <div className="guide-card">
          <div className="guide-icon">📖</div>
          <h3>도서관 비유로 이해하는 k-익명성</h3>
          <p>
            사서에게 <em>"제 비밀번호 책 있나요?"</em>라고 제목을 직접 말하는 대신,
            <em>"'ㅂ'으로 시작하는 책 목록 전부 주세요"</em>라고 요청합니다.
          </p>
          <p>
            받아온 수백 권의 책 목록 안에서 내 책이 있는지 찾는 작업은 <strong>내 방(브라우저)</strong> 안에서 혼자 진행합니다.
            사서는 내가 그 수백 권 중 어떤 책을 찾았는지 절대 알 수 없습니다.
          </p>
        </div>

        {/* 원리 카드 2 */}
        <div className="guide-card">
          <div className="guide-icon">🛡️</div>
          <h3>최소 전송 원칙 (Minimal Data Transmission)</h3>
          <p>
            비밀번호 원문 대신 <strong>SHA-1 해시(40자리)</strong>를 계산하고,
            그 중에서도 <strong>단 앞의 5자리(Prefix)</strong>만 외부 통신에 사용합니다.
          </p>
          <div className="code-snippet-box">
            <code>"password" → 5BAA6 1E4C9...</code>
            <br />
            <code>전송: GET /range/5BAA6 (5자리만)</code>
          </div>
        </div>

        {/* 원리 카드 3 */}
        <div className="guide-card">
          <div className="guide-icon">🔍</div>
          <h3>F12 개발자 도구 Network 탭 검증법</h3>
          <p>
            웹 브라우저에서 <strong>F12</strong>를 누르고 <strong>Network(네트워크)</strong> 탭을 엽니다.
            비밀번호 진단기에서 [유출 여부 확인하기] 버튼을 누른 뒤 요청 항목을 클릭합니다.
          </p>
          <ul>
            <li><strong>Request URL</strong>: <code>https://api.pwnedpasswords.com/range/5BAA6</code> 확인</li>
            <li><strong>Payload / Query</strong>: 비밀번호 원문이나 뒤 35자리가 전송되지 않음을 확인</li>
            <li><strong>Request Headers</strong>: <code>Add-Padding: true</code> 확인</li>
          </ul>
        </div>

        {/* 원리 카드 4 */}
        <div className="guide-card">
          <div className="guide-icon">⚠️</div>
          <h3>k-익명성의 한계: 완전한 익명이 아닌 이유</h3>
          <p>
            k-익명성은 비밀번호 원문과 정확한 해시값은 보호하지만, 
            <strong>서버는 여전히 요청자의 IP 주소, 요청 시각, 앞 5글자 접두사</strong>를 수집할 수 있습니다.
          </p>
          <p>
            따라서 "비밀번호는 지키지만, 내가 해당 접두사를 가진 비밀번호를 조회했다는 사실 자체"까지 숨기지는 못한다는 점을 이해해야 합니다.
          </p>
        </div>
      </div>

      {/* 실습 및 과제 회고 가이드 */}
      <div className="retrospective-helper-card">
        <h3>📝 README.md 회고 작성 도우미</h3>
        <p>실습 제출 시 README.md에 포함해야 할 핵심 질문 체크리스트입니다:</p>
        <ol>
          <li>
            <strong>Network 탭 실제 요청 주소</strong>: <code>https://api.pwnedpasswords.com/range/XXXXX</code> (앞 5자리만 포함되었는가?)
          </li>
          <li>
            <strong>Math.random() vs crypto.getRandomValues()</strong>: 암호학적 안전성(CSPRNG)과 난수 예측 불가능성의 차이
          </li>
          <li>
            <strong>Vite 프로젝트 직접 구성 경험</strong>: <code>package.json</code>, <code>.gitignore</code>(.env 차단), <code>vite.config.js</code>(base 설정)의 역할
          </li>
        </ol>
      </div>
    </div>
  );
}
