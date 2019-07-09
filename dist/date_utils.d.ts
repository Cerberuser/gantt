declare class date_utils {
    parse(date: Date | string, date_separator?: string, time_separator?: RegExp): Date;
    to_string(date: Date, with_time?: boolean): string;
    format(date: Date, format_string?: string, lang?: 'en' | 'ru' | 'ptBr'): string;
    diff(date_a: any, date_b: any, scale?: string): number;
    today(): Date;
    now(): Date;
    add(date: Date, qty: any, scale: string): Date;
    start_of(date: Date, scale: string): Date;
    clone(date: Date): Date;
    get_date_values(date: Date): [number, number, number, number, number, number, number];
    get_days_in_month(date: Date): number;
}
declare const utils: date_utils;
export default utils;
