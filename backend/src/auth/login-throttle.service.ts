import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Attempt {
  count: number;
  lockedUntil: number | null;
}

/**
 * Pembatasan percobaan login gagal (in-memory, per instance).
 * Setelah MAX_ATTEMPTS gagal, identifier terkunci selama LOCK_MINUTES.
 * Untuk multi-instance di produksi, ganti dengan store terdistribusi (Redis).
 */
@Injectable()
export class LoginThrottleService {
  private readonly store = new Map<string, Attempt>();
  private readonly maxAttempts: number;
  private readonly lockMinutes: number;

  constructor(config: ConfigService) {
    this.maxAttempts = config.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    this.lockMinutes = config.get<number>('LOGIN_LOCK_MINUTES', 15);
  }

  /** Cek apakah identifier sedang terkunci. */
  isLocked(identifier: string): { locked: boolean; retryAfterMin: number } {
    const key = this.normalize(identifier);
    const attempt = this.store.get(key);
    if (!attempt?.lockedUntil) return { locked: false, retryAfterMin: 0 };
    if (Date.now() >= attempt.lockedUntil) {
      this.store.delete(key);
      return { locked: false, retryAfterMin: 0 };
    }
    const retryAfterMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return { locked: true, retryAfterMin };
  }

  /** Catat kegagalan; kembalikan sisa percobaan dan status terkunci. */
  recordFailure(identifier: string): { remaining: number; locked: boolean } {
    const key = this.normalize(identifier);
    const attempt = this.store.get(key) ?? { count: 0, lockedUntil: null };
    attempt.count += 1;
    if (attempt.count >= this.maxAttempts) {
      attempt.lockedUntil = Date.now() + this.lockMinutes * 60000;
      attempt.count = 0;
      this.store.set(key, attempt);
      return { remaining: 0, locked: true };
    }
    this.store.set(key, attempt);
    return { remaining: this.maxAttempts - attempt.count, locked: false };
  }

  /** Bersihkan catatan setelah login sukses. */
  clear(identifier: string): void {
    this.store.delete(this.normalize(identifier));
  }

  private normalize(id: string): string {
    return id.trim().toLowerCase();
  }
}
