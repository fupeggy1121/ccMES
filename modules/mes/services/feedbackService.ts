import { supabase } from '../lib/supabase';
import { UserIntent } from './intentRecognizer';

export interface FeedbackData {
  messageId: string;
  feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'other';
  rating: number;
  comment: string;
  query: string;
  response: string;
  intent?: UserIntent;
  resultData?: any[];
}

export interface FeedbackResponse {
  success: boolean;
  feedbackId?: string;
  message: string;
}

export class FeedbackService {
  async submitFeedback(feedbackData: FeedbackData): Promise<FeedbackResponse> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            message_id: feedbackData.messageId,
            feedback_type: feedbackData.feedbackType,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            query: feedbackData.query,
            response: feedbackData.response
          }
        ])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error submitting feedback:', error);
        return {
          success: false,
          message: '反馈提交失败，请重试'
        };
      }

      if (!data) {
        return {
          success: false,
          message: '反馈提交失败'
        };
      }

      const feedbackId = data.id;

      if (feedbackData.intent) {
        await this.submitIntentFeedback(
          feedbackId,
          feedbackData.intent,
          feedbackData.response
        );
      }

      if (feedbackData.resultData && feedbackData.resultData.length > 0) {
        await this.submitResultFeedback(
          feedbackId,
          feedbackData.feedbackType,
          feedbackData.comment
        );
      }

      return {
        success: true,
        feedbackId,
        message: '感谢您的反馈！这将帮助我们改进系统。'
      };
    } catch (error) {
      console.error('Unexpected error in submitFeedback:', error);
      return {
        success: false,
        message: '反馈提交出错，请稍后重试'
      };
    }
  }

  private async submitIntentFeedback(
    feedbackId: string,
    intent: UserIntent,
    response: string
  ): Promise<void> {
    const recognizedIntent = this.formatIntent(intent);
    const { error } = await supabase
      .from('intent_feedback')
      .insert([
        {
          feedback_id: feedbackId,
          recognized_intent: recognizedIntent,
          actual_intent: '', // 用户可通过注释提供
          confidence: intent.confidence,
          is_correct: !response.toLowerCase().includes('抱歉')
        }
      ]);

    if (error) {
      console.error('Error submitting intent feedback:', error);
    }
  }

  private async submitResultFeedback(
    feedbackId: string,
    feedbackType: string,
    comment: string
  ): Promise<void> {
    const resultAccuracy = feedbackType === 'helpful' ? 'accurate' : 'incorrect';

    const { error } = await supabase
      .from('query_result_feedback')
      .insert([
        {
          feedback_id: feedbackId,
          result_accuracy: resultAccuracy,
          missing_data: feedbackType === 'not_helpful' ? comment : '',
          extra_data: feedbackType === 'other' ? comment : '',
          suggestion: comment
        }
      ]);

    if (error) {
      console.error('Error submitting result feedback:', error);
    }
  }

  private formatIntent(intent: UserIntent): string {
    const parts: string[] = [];

    if (intent.type) parts.push(intent.type);
    if (intent.entities.metric) parts.push(intent.entities.metric);
    if (intent.entities.timeRange) parts.push(intent.entities.timeRange);

    return parts.join('_') || 'unknown';
  }

  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    helpfulRate: number;
    averageRating: number;
    topIssues: { issue: string; count: number }[];
  }> {
    try {
      const { data: allFeedback, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error || !allFeedback) {
        return {
          totalFeedback: 0,
          helpfulRate: 0,
          averageRating: 0,
          topIssues: []
        };
      }

      const totalFeedback = allFeedback.length;
      const helpfulCount = allFeedback.filter(
        f => f.feedback_type === 'helpful'
      ).length;
      const helpfulRate = totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0;

      const averageRating = totalFeedback > 0
        ? allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback
        : 0;

      const commentCounts: Record<string, number> = {};
      allFeedback.forEach(f => {
        if (f.comment) {
          if (!commentCounts[f.comment]) {
            commentCounts[f.comment] = 0;
          }
          commentCounts[f.comment]++;
        }
      });

      const topIssues = Object.entries(commentCounts)
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalFeedback,
        helpfulRate: Math.round(helpfulRate * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        topIssues
      };
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      return {
        totalFeedback: 0,
        helpfulRate: 0,
        averageRating: 0,
        topIssues: []
      };
    }
  }

  async getIntentAccuracy(): Promise<{
    totalIntents: number;
    correctCount: number;
    accuracy: number;
    byIntent: Record<string, { total: number; correct: number; accuracy: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('intent_feedback')
        .select('*')
        .limit(1000);

      if (error || !data) {
        return {
          totalIntents: 0,
          correctCount: 0,
          accuracy: 0,
          byIntent: {}
        };
      }

      const totalIntents = data.length;
      const correctCount = data.filter(f => f.is_correct).length;
      const accuracy = totalIntents > 0 ? (correctCount / totalIntents) * 100 : 0;

      const byIntent: Record<string, { total: number; correct: number; accuracy: number }> = {};

      data.forEach(f => {
        const intent = f.recognized_intent;
        if (!byIntent[intent]) {
          byIntent[intent] = { total: 0, correct: 0, accuracy: 0 };
        }
        byIntent[intent].total++;
        if (f.is_correct) {
          byIntent[intent].correct++;
        }
      });

      Object.keys(byIntent).forEach(intent => {
        const stats = byIntent[intent];
        stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      });

      return {
        totalIntents,
        correctCount,
        accuracy: Math.round(accuracy * 100) / 100,
        byIntent
      };
    } catch (error) {
      console.error('Error calculating intent accuracy:', error);
      return {
        totalIntents: 0,
        correctCount: 0,
        accuracy: 0,
        byIntent: {}
      };
    }
  }

  async getRecentFeedback(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return error ? [] : (data || []);
    } catch (error) {
      console.error('Error fetching recent feedback:', error);
      return [];
    }
  }
}

export const feedbackService = new FeedbackService();
