import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly enabled: boolean;
  private readonly timeout = 2000;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('AI_SERVICE_URL', '');
    this.token = this.configService.get('AI_SERVICE_TOKEN', '');
    this.enabled = !!this.baseUrl && !!this.token;
  }

  async generateProfileBio(input: {
    headline?: string;
    skills?: string[];
    services?: string[];
    niches?: string[];
    tone?: string;
  }): Promise<AiResponse<{ bio: string; headline?: string }>> {
    if (!this.enabled) return { success: false, error: 'AI service not configured' };

    try {
      const response = await this.makeRequest('/assist/profile-bio', {
        input,
        constraints: { max_chars: 600 },
      });
      return { success: true, data: response.result };
    } catch (error) {
      this.logger.warn('AI profile bio generation failed', error);
      return { success: false, error: 'AI service unavailable' };
    }
  }

  async generatePostCaption(input: {
    postText?: string;
    audience?: string;
    tone?: string;
  }): Promise<AiResponse<{ captions: string[] }>> {
    if (!this.enabled) return { success: false, error: 'AI service not configured' };

    try {
      const response = await this.makeRequest('/assist/post-caption', {
        input,
        constraints: { max_suggestions: 3 },
      });
      return { success: true, data: response.result };
    } catch (error) {
      this.logger.warn('AI caption generation failed', error);
      return { success: false, error: 'AI service unavailable' };
    }
  }

  async suggestKeywords(text: string): Promise<AiResponse<{ hashtags: string[]; keywords: string[] }>> {
    if (!this.enabled) return { success: false, error: 'AI service not configured' };

    try {
      const response = await this.makeRequest('/assist/keywords', {
        input: { text, locale: 'en-US' },
        constraints: { max_hashtags: 8, max_keywords: 8 },
      });
      return { success: true, data: response.result };
    } catch (error) {
      this.logger.warn('AI keyword suggestion failed', error);
      return { success: false, error: 'AI service unavailable' };
    }
  }

  async checkContent(input: {
    text?: string;
    mediaUrls?: { url: string; type: string }[];
  }): Promise<AiResponse<{ decision: 'allow' | 'warn' | 'block'; labels: string[] }>> {
    if (!this.enabled) return { success: true, data: { decision: 'allow', labels: [] } };

    try {
      const response = await this.makeRequest('/moderation/content-check', {
        input: {
          text: input.text,
          media: input.mediaUrls,
        },
        policy: { strictness: 'standard' },
      });
      return { success: true, data: response.result };
    } catch (error) {
      this.logger.warn('AI content check failed - allowing by default', error);
      return { success: true, data: { decision: 'allow', labels: [] } };
    }
  }

  private async makeRequest(endpoint: string, body: unknown): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
