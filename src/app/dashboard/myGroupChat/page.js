'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './myGroupChat.module.css';

export default function MyGroupChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('my'); // my, public
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGroups();
  }, [activeTab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const type = activeTab === 'my' ? 'my' : 'public';
      const response = await fetch(`/api/groupchats?type=${type}&page=1&limit=50`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load groups');
      }

      setGroups(data.groups);
    } catch (err) {
      console.error('❌ Error loading groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      // ورود به گروه (نیازی به API خاص نیست، فقط redirect)
      router.push(`/dashboard/groupchat/${groupId}`);
    } catch (err) {
      console.error('❌ Error joining group:', err);
      alert(err.message);
    }
  };

  const handleOpenChat = (groupId) => {
    router.push(`/dashboard/groupchat/${groupId}`);
  };

  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(messageDate);
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>گفتگوهای من</h1>
        <p className={styles.subtitle}>گروه‌های چت رویدادها</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'my' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('my')}
        >
          💬 گفتگوهای من
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'public' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('public')}
        >
          🌐 گفتگوهای عمومی
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>
            {activeTab === 'my' ? 'هیچ گفتگویی یافت نشد' : 'هیچ گروه عمومی‌ای یافت نشد'}
          </h3>
          <p>
            {activeTab === 'my'
              ? 'شما هنوز در هیچ گروه چتی عضو نیستید'
              : 'در حال حاضر گروه عمومی فعالی وجود ندارد'}
          </p>
        </div>
      ) : (
        <div className={styles.groupsList}>
          {groups.map((group) => (
            <div
              key={group._id}
              className={styles.groupCard}
              onClick={() => handleOpenChat(group._id)}
            >
              {/* Avatar */}
              <div className={styles.groupAvatar}>
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} />
                ) : (
                  <div className={styles.groupAvatarPlaceholder}>
                    {group.event?.title?.charAt(0) || 'G'}
                  </div>
                )}
                {group.membership?.stats?.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>
                    {group.membership.stats.unreadCount}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.groupInfo}>
                <div className={styles.groupHeader}>
                  <h3 className={styles.groupName}>{group.name}</h3>
                  {group.lastMessageAt && (
                    <span className={styles.lastMessageTime}>
                      {formatLastMessageTime(group.lastMessageAt)}
                    </span>
                  )}
                </div>

                <p className={styles.groupEventTitle}>{group.event?.title}</p>

                {/* Last Message Preview */}
                {group.lastMessage && (
                  <div className={styles.lastMessage}>
                    {group.lastMessage.sender && (
                      <span className={styles.lastMessageSender}>
                        {group.lastMessage.sender.firstName}:
                      </span>
                    )}
                    <span className={styles.lastMessageContent}>
                      {group.lastMessage.content?.substring(0, 50) || 'پیام'}
                      {group.lastMessage.content?.length > 50 && '...'}
                    </span>
                  </div>
                )}

                {/* Stats & Badges */}
                <div className={styles.groupFooter}>
                  <div className={styles.groupStats}>
                    <span className={styles.statItem}>
                      👥 {group.stats.activeMembers}
                    </span>
                    <span className={styles.statItem}>
                      💬 {group.stats.totalMessages}
                    </span>
                  </div>
                  
                  <div className={styles.groupBadges}>
                    {group.visibility === 'public' && (
                      <span className={`${styles.badge} ${styles.badgePublic}`}>
                        🌐
                      </span>
                    )}
                    {group.isClosed && (
                      <span className={`${styles.badge} ${styles.badgeClosed}`}>
                        ⛔
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'public' && !group.membership && (
                <div className={styles.groupActions}>
                  <button
                    className={styles.joinBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(group._id);
                    }}
                  >
                    ورود به گروه
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



