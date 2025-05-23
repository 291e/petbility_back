import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TossPaymentsError } from './toss-payments.error';
import { ApprovePaymentDto } from '@/user/payments/dto/approve-payment.dto';
import { lastValueFrom } from 'rxjs';
import axios from 'axios';

/**
 * 토스페이먼츠 연동 서비스
 */
@Injectable()
export class TossPaymentsService {
  private readonly logger = new Logger(TossPaymentsService.name);
  private readonly tossSecretKey: string;
  private readonly tossPaymentsUrl = 'https://api.tosspayments.com/v1/payments';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('TOSS_SECRET_KEY');
    if (!secretKey) {
      throw new Error('TOSS_SECRET_KEY is not defined');
    }
    this.tossSecretKey = secretKey;
  }

  /**
   * 결제 생성 요청
   * @param paymentData 결제 생성 데이터
   * @returns 결제 생성 응답
   */
  async createPayment(paymentData: {
    orderId: string;
    amount: number;
    orderName: string;
  }) {
    try {
      this.logger.log(
        `토스페이먼츠 결제 생성 요청: ${JSON.stringify(paymentData)}`,
      );

      // 토스페이먼츠 API는 결제 생성 시 amount를 문자열로 전달해야 함
      const requestData = {
        ...paymentData,
        amount: paymentData.amount.toString(),
      };

      // 토스페이먼츠 API는 결제 생성 시 클라이언트 측에서 처리해야 함
      // 서버에서는 결제 키를 생성하는 대신 결제 정보를 반환
      return {
        paymentKey: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        amount: paymentData.amount,
        successUrl: `${process.env.FRONTEND_URL}/payments/success?orderId=${paymentData.orderId}`,
        failUrl: `${process.env.FRONTEND_URL}/payments/fail?orderId=${paymentData.orderId}`,
      };
    } catch (error) {
      this.logger.error(`토스페이먼츠 결제 생성 실패: ${error.message}`);

      if (error.response && error.response.data) {
        throw new TossPaymentsError(
          error.response.data.message || '결제 생성 중 오류가 발생했습니다.',
          error.response.data.code,
        );
      }

      throw new TossPaymentsError(
        '결제 생성 중 오류가 발생했습니다.',
        'UNKNOWN_ERROR',
      );
    }
  }

  /**
   * 결제 승인 요청
   * @param approvePaymentDto 결제 승인 DTO
   * @returns 결제 승인 응답
   */
  async approvePayment(approvePaymentDto: ApprovePaymentDto) {
    try {
      this.logger.log(
        `토스페이먼츠 결제 승인 요청: ${JSON.stringify(approvePaymentDto)}`,
      );

      const { paymentKey, orderId, amount } = approvePaymentDto;

      // 요청 데이터 로깅
      const requestData = {
        orderId,
        amount: amount.toString(),
      };
      this.logger.log(
        `토스페이먼츠 API 요청 데이터: ${JSON.stringify(requestData)}`,
      );
      this.logger.log(
        `토스페이먼츠 API 요청 URL: ${this.tossPaymentsUrl}/${paymentKey}`,
      );

      // API 키 확인
      if (!this.tossSecretKey) {
        throw new TossPaymentsError(
          '토스페이먼츠 API 키가 설정되지 않았습니다.',
          'API_KEY_NOT_SET',
        );
      }

      const authHeader = `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`;
      this.logger.log(`Authorization 헤더: ${authHeader}`);

      const response = await axios.post(
        `${this.tossPaymentsUrl}/${paymentKey}`,
        requestData,
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`토스페이먼츠 결제 승인 성공: ${orderId}`);
      this.logger.log(
        `토스페이먼츠 API 응답: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`토스페이먼츠 결제 승인 실패: ${error.message}`);

      // 에러 상세 정보 로깅
      if (error.response) {
        this.logger.error(
          `토스페이먼츠 API 에러 응답: ${JSON.stringify(error.response.data)}`,
        );
        this.logger.error(
          `토스페이먼츠 API 에러 상태 코드: ${error.response.status}`,
        );
        this.logger.error(
          `토스페이먼츠 API 에러 헤더: ${JSON.stringify(error.response.headers)}`,
        );
      } else if (error.request) {
        this.logger.error(
          `토스페이먼츠 API 요청 실패: ${JSON.stringify(error.request)}`,
        );
      } else {
        this.logger.error(`토스페이먼츠 API 에러: ${error.message}`);
      }

      if (error.response?.data) {
        throw new TossPaymentsError(
          error.response.data.message || '결제 승인 중 오류가 발생했습니다.',
          error.response.data.code || 'UNKNOWN_ERROR',
        );
      }

      throw new TossPaymentsError(
        '결제 승인 중 오류가 발생했습니다.',
        'UNKNOWN_ERROR',
      );
    }
  }

  /**
   * 결제 취소 요청
   * @param paymentKey 결제 키
   * @param cancelReason 취소 사유
   * @returns 결제 취소 응답
   */
  async cancelPayment(paymentKey: string, cancelReason: string) {
    try {
      this.logger.log(
        `토스페이먼츠 결제 취소 요청: ${paymentKey}, ${cancelReason}`,
      );

      const response = await axios.post(
        `${this.tossPaymentsUrl}/${paymentKey}/cancel`,
        {
          cancelReason,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`토스페이먼츠 결제 취소 성공: ${paymentKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`토스페이먼츠 결제 취소 실패: ${error.message}`);

      if (error.response && error.response.data) {
        throw new TossPaymentsError(
          error.response.data.message || '결제 취소 중 오류가 발생했습니다.',
          error.response.data.code,
        );
      }

      throw new TossPaymentsError(
        '결제 취소 중 오류가 발생했습니다.',
        'UNKNOWN_ERROR',
      );
    }
  }

  /**
   * 결제 정보 조회
   * @param paymentKey 결제 키
   * @returns 결제 정보
   */
  async getPayment(paymentKey: string) {
    try {
      this.logger.log(`토스페이먼츠 결제 정보 조회 요청: ${paymentKey}`);

      const response = await lastValueFrom(
        this.httpService.get(`${this.tossPaymentsUrl}/${paymentKey}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`토스페이먼츠 결제 정보 조회 성공: ${paymentKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`토스페이먼츠 결제 정보 조회 실패: ${error.message}`);

      if (error.response && error.response.data) {
        throw new TossPaymentsError(
          error.response.data.message ||
            '결제 정보 조회 중 오류가 발생했습니다.',
          error.response.data.code,
        );
      }

      throw new TossPaymentsError(
        '결제 정보 조회 중 오류가 발생했습니다.',
        'UNKNOWN_ERROR',
      );
    }
  }
}
