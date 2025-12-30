'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Languages, Globe } from 'lucide-react';
import type { SupportedLanguage } from '@/lib/translation';
import { notifyNewMessage } from '@/app/actions/transaction';
import { formatRelativeTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { logger } from '@/lib/logger';

interface MessagingMessage {
  id: string;
  author_profile_id: string;
  author_name: string;
  content_original: string;
  original_language: string;
  translated_text?: Record<string, string> | null; // JSONB cache: {"it": "...", "en": "..."}
  created_at: string;
}

interface MessagingPanelProps {
  transactionId: string;
  messages: MessagingMessage[];
  onRefresh: () => void;
}

export function MessagingPanel({ transactionId, messages: initialMessages, onRefresh }: MessagingPanelProps) {
  const { user, profile } = useAuth();
  const { t, tVar } = useLanguage();
  const [messages, setMessages] = useState<MessagingMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userLanguage: SupportedLanguage = (profile?.preferred_language as SupportedLanguage) || 'en';

  useEffect(() => {
    setMessages(initialMessages);
    // Auto-translate messages that need translation
    autoTranslateMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-translate messages that need translation
  const autoTranslateMessages = async (msgs: MessagingMessage[]) => {
    if (!supabase || !user) return;

    for (const message of msgs) {
      const messageLanguage = message.original_language as SupportedLanguage;
      const needsTranslation = messageLanguage !== userLanguage;
      const hasTranslation = message.translated_text?.[userLanguage];

      // If message needs translation and doesn't have one cached, fetch it
      if (needsTranslation && !hasTranslation) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: message.content_original,
              targetLang: userLanguage,
              sourceLang: messageLanguage,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            const translatedText = result.translatedText;

            // Update translated_text JSONB with new translation
            const updatedTranslations = {
              ...(message.translated_text || {}),
              [userLanguage]: translatedText,
            };

            // Save to database
            await supabase
              .from('messages')
              .update({ translated_text: updatedTranslations })
              .eq('id', message.id);

            // Update local state
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === message.id
                  ? { ...msg, translated_text: updatedTranslations }
                  : msg
              )
            );
          }
        } catch (error: any) {
          logger.error('Auto-translation failed', { messageId: message.id, error: error.message });
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !supabase || !user) return;

    try {
      setSending(true);

      // Get all transaction participants to determine who needs translations
      const { data: participants } = await supabase
        .from('transaction_participants')
        .select('profile_id, profiles!inner(preferred_language)')
        .eq('transaction_id', transactionId);

      // Find languages of other participants (excluding current user)
      const otherLanguages = participants
        ?.filter((p: any) => p.profile_id !== user.id)
        .map((p: any) => (p.profiles as any)?.preferred_language as SupportedLanguage)
        .filter((lang: any): lang is SupportedLanguage => lang !== null && lang !== userLanguage) || [];

      const uniqueTargetLangs = [...new Set(otherLanguages)];

      // If there are other languages, translate the message
      let translatedContent = null;
      let translatedLanguage = null;

      if (uniqueTargetLangs.length > 0) {
        // For now, translate to the first different language
        // In future, could store multiple translations
        const targetLang = uniqueTargetLangs[0];

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newMessage.trim(),
            targetLang,
            sourceLang: userLanguage,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          translatedContent = result.translatedText;
          translatedLanguage = targetLang;
        }
      }

      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          transaction_id: transactionId,
          author_profile_id: user.id,
          content_original: newMessage.trim(),
          original_language: userLanguage,
          content_translated: translatedContent,
          translated_language: translatedLanguage,
        })
        .select(`
          id,
          author_profile_id,
          content_original,
          content_translated,
          original_language,
          translated_language,
          created_at,
          profiles!messages_author_profile_id_fkey (
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Add new message to local state
      const newMsg: MessagingMessage = {
        ...data,
        author_name: (data.profiles as any)?.full_name || 'Unknown',
      };

      setMessages([...messages, newMsg]);
      setNewMessage('');

      // Trigger notifications
      await notifyNewMessage(transactionId, user.id, newMessage.trim());

      onRefresh();
    } catch (error: any) {
      logger.error('Failed to send message', { transactionId, error: error.message });
      toast.error(t('messages.sendFailed'), {
        description: t('messages.sendFailedDescription')
      });
    } finally {
      setSending(false);
    }
  };

  const handleTranslateOnDemand = async (messageId: string, originalText: string, sourceLang: string) => {
    if (!supabase) return;

    try {
      setTranslating({ ...translating, [messageId]: true });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          targetLang: userLanguage,
          sourceLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      const translatedText = result.translatedText;

      // Find the message and update its translations
      const message = messages.find(m => m.id === messageId);
      const updatedTranslations = {
        ...(message?.translated_text || {}),
        [userLanguage]: translatedText,
      };

      // Update message in database
      await supabase
        .from('messages')
        .update({ translated_text: updatedTranslations })
        .eq('id', messageId);

      // Update local state
      setMessages(messages.map(msg =>
        msg.id === messageId
          ? { ...msg, translated_text: updatedTranslations }
          : msg
      ));

      onRefresh();
    } catch (error: any) {
      logger.error('Translation failed', { messageId, error: error.message });
      toast.error(t('messages.translationFailed'), {
        description: t('messages.translationFailedDescription')
      });
    } finally {
      setTranslating({ ...translating, [messageId]: false });
    }
  };

  const toggleShowOriginal = (messageId: string) => {
    setShowOriginal({
      ...showOriginal,
      [messageId]: !showOriginal[messageId],
    });
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[600px] sm:h-[calc(100vh-200px)]">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Start the conversation! Send a message to begin collaborating on this transaction."
          />
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.author_profile_id === user?.id;
            const messageLanguage = message.original_language as SupportedLanguage;
            const needsTranslation = messageLanguage !== userLanguage;
            const translatedContent = message.translated_text?.[userLanguage];
            const hasTranslation = !!translatedContent;
            const showingOriginal = showOriginal[message.id];

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* Author and time */}
                  <div className={`flex items-center gap-2 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-medium text-gray-700">
                      {message.author_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(message.created_at)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {messageLanguage.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Message content */}
                  <Card className={`p-3 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                    {/* Always show translated version first if available and needed */}
                    {needsTranslation && hasTranslation && !showingOriginal ? (
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          <Languages className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed break-words">
                            {translatedContent}
                          </p>
                        </div>
                        <div className={`text-xs mt-2 pt-2 border-t ${isOwnMessage ? 'border-primary/40' : 'border-gray-200'}`}>
                          <button
                            onClick={() => toggleShowOriginal(message.id)}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Show original ({messageLanguage.toUpperCase()})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm leading-relaxed break-words">
                          {message.content_original}
                        </p>
                        
                        {/* Translation controls - only show if translating */}
                        {needsTranslation && !hasTranslation && translating[message.id] && (
                          <div className={`text-xs mt-2 pt-2 border-t ${isOwnMessage ? 'border-primary/40' : 'border-gray-200'}`}>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Languages className="h-3 w-3 animate-pulse" />
                              Translating...
                            </span>
                          </div>
                        )}
                        {needsTranslation && hasTranslation && (
                          <div className={`text-xs mt-2 pt-2 border-t ${isOwnMessage ? 'border-primary/40' : 'border-gray-200'}`}>
                            <button
                              onClick={() => toggleShowOriginal(message.id)}
                              className="flex items-center gap-1 hover:underline"
                            >
                              <Languages className="h-3 w-3" />
                              Show translation ({userLanguage.toUpperCase()})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={tVar('messages.typeMessageIn', { lang: userLanguage.toUpperCase() })}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? t('action.sending') : t('action.send')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <Languages className="h-3 w-3 inline mr-1" />
          {t('messages.autoTranslate')}
        </p>
      </div>
    </div>
  );
}

