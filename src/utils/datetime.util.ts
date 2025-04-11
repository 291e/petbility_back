// src/utils/datetime.util.ts

// 요일 문자열 반환 ('mon', 'tue' 등)
export function getDayOfWeek(date: string | Date): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];
}

/**
 * 시간 문자열(HH:mm)을 반환합니다.
 * @param time ISO 형식의 시간 문자열
 * @returns HH:mm 형식의 시간 문자열
 */
export function getTimeOnly(time: string): string {
  return time.split('T')[1].substring(0, 5);
}

// 시작 ~ 끝 사이의 30분 간격 슬롯 반환 (['09:00', '09:30', '10:00', ...])
export function generateTimeSlots(
  start: string | null,
  end: string | null,
): string[] {
  if (!start || !end) return [];

  // 시작 시간과 종료 시간을 분 단위로 변환
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // 결과 배열 초기화
  const slots: string[] = [];

  // 30분 단위로 시간대 생성
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    );
  }

  return slots;
}

// 날짜 + 시간 문자열 → Date 객체로 변환 (UTC 기준)
export function buildDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}
