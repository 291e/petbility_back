// src/utils/datetime.util.ts

// 요일 문자열 반환 ('mon', 'tue' 등)
export function getDayOfWeek(date: string | Date): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];
}

// 시간만 추출 ('13:00' 형태)
export function getTimeOnly(date: string | Date): string {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
}

// 시작 ~ 끝 사이의 1시간 간격 슬롯 반환 (['09:00', '10:00', ...])
export function generateTimeSlots(start: string, end: string): string[] {
  const result: string[] = [];
  let [startHour] = start.split(':').map(Number);
  const [endHour] = end.split(':').map(Number);

  while (startHour < endHour) {
    result.push(`${startHour.toString().padStart(2, '0')}:00`);
    startHour++;
  }

  return result;
}

// 날짜 + 시간 문자열 → Date 객체로 변환 (UTC 기준)
export function buildDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}
