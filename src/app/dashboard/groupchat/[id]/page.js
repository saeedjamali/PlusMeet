'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './groupchat.module.css';

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadGroupAndMessages();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroupAndMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // دریافت گروه
      const groupRes = await fetch(`/api/groupchats/${id}`);
      const groupData = await groupRes.json();

      if (!groupRes.ok) {
        throw new Error(groupData.error || 'Failed to load group');
      }

      setGroup(groupData.groupChat);

      // دریافت پیام‌ها
      const messagesRes = await fetch(`/api/groupchats/${id}/messages?limit=100`);
      const messagesData = await messagesRes.json();

      if (!messagesRes.ok) {
        throw new Error(messagesData.error || 'Failed to load messages');
      }

      setMessages(messagesData.messages);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSending(true);

      const response = await fetch(`/api/groupchats/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // افزودن پیام به لیست
      setMessages((prev) => [...prev, data.data]);
      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (err) {
      console.error('❌ Error sending message:', err);
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/groupchats/${id}/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add reaction');
      }

      // Reload messages
      const messagesRes = await fetch(`/api/groupchats/${id}/messages?limit=100`);
      const messagesData = await messagesRes.json();
      setMessages(messagesData.messages);
    } catch (err) {
      console.error('❌ Error adding reaction:', err);
    }
  };

  const formatMessageTime = (date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>خطا</h2>
          <p>{error || 'گروه یافت نشد'}</p>
          <button onClick={() => router.back()}>بازگشت</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
        <div className={styles.headerInfo}>
          <h2 className={styles.groupName}>{group.name}</h2>
          <p className={styles.groupMembers}>
            👥 {group.stats.activeMembers} عضو
          </p>
        </div>
        <div className={styles.headerActions}>
          {group.isAdmin && (
            <button
              className={styles.headerBtn}
              onClick={() => router.push(`/dashboard/groupchatmanagment/${id}/settings`)}
              title="تنظیمات"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <p>هنوز پیامی ارسال نشده است</p>
            <p>اولین نفری باشید که پیام می‌فرستد! 💬</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message._id}
                className={`${styles.message} ${
                  message.messageType === 'system' ? styles.messageSystem : ''
                }`}
              >
                {message.messageType !== 'system' && (
                  <>
                    <div className={styles.messageSender}>
                      <span className={styles.senderName}>
                        {message.sender?.firstName || 'ناشناس'}
                      </span>
                      <span className={styles.messageTime}>
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <div className={styles.messageContent}>{message.content}</div>
                    
                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className={styles.messageReactions}>
                        {message.reactions.map((reaction, idx) => (
                          <span key={idx} className={styles.reaction}>
                            {reaction.emoji} {reaction.count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Reactions */}
                    <div className={styles.quickReactions}>
                      {['👍', '❤️', '😂', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          className={styles.quickReactionBtn}
                          onClick={() => handleReaction(message._id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {message.messageType === 'system' && (
                  <div className={styles.systemMessageContent}>
                    {message.content || 'پیام سیستمی'}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {group.isClosed ? (
        <div className={styles.closedNotice}>
          ⛔ این گروه بسته شده است
        </div>
      ) : (
        <form className={styles.inputContainer} onSubmit={handleSendMessage}>
          <input
            ref={messageInputRef}
            type="text"
            className={styles.messageInput}
            placeholder="پیام خود را بنویسید..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            maxLength={group.settings?.maxMessageLength || 2000}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      )}
    </div>
  );
}



