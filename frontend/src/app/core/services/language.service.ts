import { Injectable, signal } from '@angular/core';

export type SiteLanguage = 'English' | 'Tamil' | 'Hindi';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'vw_account_settings';

  readonly language = signal<SiteLanguage>(this.readInitialLanguage());

  setLanguage(language: SiteLanguage): void {
    this.language.set(language);
    this.persistLanguage(language);
    this.applyDocumentLanguage(language);
    window.dispatchEvent(new CustomEvent('vw-language-changed', { detail: { language } }));
  }

  private readInitialLanguage(): SiteLanguage {
    const stored = this.readStoredLanguage();
    this.applyDocumentLanguage(stored);
    return stored;
  }

  private readStoredLanguage(): SiteLanguage {
    if (typeof window === 'undefined') {
      return 'English';
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return 'English';
    }

    try {
      const parsed = JSON.parse(raw) as { language?: string };
      if (parsed.language === 'Tamil' || parsed.language === 'Hindi' || parsed.language === 'English') {
        return parsed.language;
      }
    } catch {
      return 'English';
    }

    return 'English';
  }

  private persistLanguage(language: SiteLanguage): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      parsed['language'] = language;
      localStorage.setItem(this.storageKey, JSON.stringify(parsed));
    } catch {
      localStorage.setItem(this.storageKey, JSON.stringify({ language }));
    }
  }

  private applyDocumentLanguage(language: SiteLanguage): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = language === 'Tamil' ? 'ta' : language === 'Hindi' ? 'hi' : 'en';
  }
}
