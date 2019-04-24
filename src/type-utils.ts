type NeverChecker<T> = [T] extends [never] ? any : never;

export function unreachable<T>(errorValue: NeverChecker<T>): never {throw errorValue;}
