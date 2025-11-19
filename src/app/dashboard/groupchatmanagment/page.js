'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './groupchatmanagment.module.css';

export default function GroupChatManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, public, private, closed
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGroups();
  }, [activeTab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groupchats?type=managed&page=1&limit=50`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load groups');
      }

      // فیلتر بر اساس تب
      let filteredGroups = data.groups;

      if (activeTab === 'public') {
        filteredGroups = data.groups.filter((g) => g.visibility === 'public');
      } else if (activeTab === 'private') {
        filteredGroups = data.groups.filter((g) => g.visibility === 'private');
      } else if (activeTab === 'closed') {
        filteredGroups = data.groups.filter((g) => g.isClosed);
      }

      setGroups(filteredGroups);
    } catch (err) {
      console.error('❌ Error loading groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (groupId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public';

      const response = await fetch(`/api/groupchats/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update visibility');
      }

      // Reload
      loadGroups();
    } catch (err) {
      console.error('❌ Error updating visibility:', err);
      alert(err.message);
    }
  };

  const handleToggleClosed = async (groupId, isClosed) => {
    try {
      const response = await fetch(`/api/groupchats/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !isClosed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      // Reload
      loadGroups();
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert(err.message);
    }
  };

  const handleViewChat = (groupId) => {
    router.push(`/dashboard/groupchat/${groupId}`);
  };

  const handleManageMembers = (groupId) => {
    router.push(`/dashboard/groupchatmanagment/${groupId}/members`);
  };

  const handleSettings = (groupId) => {
    router.push(`/dashboard/groupchatmanagment/${groupId}/settings`);
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
        <h1 className={styles.title}>مدیریت گفتگوها</h1>
        <p className={styles.subtitle}>مدیریت گروه‌های چت رویدادهای شما</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          همه ({groups.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'public' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('public')}
        >
          عمومی
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'private' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('private')}
        >
          خصوصی
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'closed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          بسته
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
          <h3>هیچ گروهی یافت نشد</h3>
          <p>شما هنوز مدیر هیچ گروه چتی نیستید</p>
        </div>
      ) : (
        <div className={styles.groupsList}>
          {groups.map((group) => (
            <div key={group._id} className={styles.groupCard}>
              {/* Avatar */}
              <div className={styles.groupAvatar}>
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} />
                ) : (
                  <div className={styles.groupAvatarPlaceholder}>
                    {group.event?.title?.charAt(0) || 'G'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.groupInfo}>
                <h3 className={styles.groupName}>{group.name}</h3>
                <p className={styles.groupEventTitle}>{group.event?.title}</p>
                <div className={styles.groupStats}>
                  <span className={styles.statItem}>
                    👥 {group.stats.activeMembers} عضو
                  </span>
                  <span className={styles.statItem}>
                    💬 {group.stats.totalMessages} پیام
                  </span>
                </div>
              </div>

              {/* Status Badges */}
              <div className={styles.groupBadges}>
                {group.visibility === 'public' ? (
                  <span className={`${styles.badge} ${styles.badgePublic}`}>
                    🌐 عمومی
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgePrivate}`}>
                    🔒 خصوصی
                  </span>
                )}
                {group.isClosed && (
                  <span className={`${styles.badge} ${styles.badgeClosed}`}>
                    ⛔ بسته
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className={styles.groupActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleViewChat(group._id)}
                  title="مشاهده چت"
                >
                  💬
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleManageMembers(group._id)}
                  title="مدیریت اعضا"
                >
                  👥
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleToggleVisibility(group._id, group.visibility)}
                  title={group.visibility === 'public' ? 'تبدیل به خصوصی' : 'تبدیل به عمومی'}
                >
                  {group.visibility === 'public' ? '🔒' : '🌐'}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleToggleClosed(group._id, group.isClosed)}
                  title={group.isClosed ? 'باز کردن گروه' : 'بستن گروه'}
                >
                  {group.isClosed ? '✅' : '⛔'}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleSettings(group._id)}
                  title="تنظیمات"
                >
                  ⚙️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



