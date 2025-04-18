/**
 * 토스 페이먼츠 API 에러
 */
export class TossPaymentsError extends Error {
  /**
   * 토스 페이먼츠 API 에러 코드
   */
  readonly code: string;

  /**
   * 토스 페이먼츠 API 에러 생성자
   * @param message 에러 메시지
   * @param code 에러 코드
   */
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TossPaymentsError';
    this.code = code;
  }
}
