// Handles both Capacitor (native APK) and Web Notifications API

export async function requestNotificationPermission() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const status = await LocalNotifications.requestPermissions()
      return status.display === 'granted'
    }
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
  } catch (e) {
    console.warn('Notification permission error:', e)
  }
  return false
}

export async function scheduleDailyReminder(hour = 20) {
  try {
    localStorage.setItem('notification_hour', String(hour))
    localStorage.setItem('notifications_enabled', 'true')

    if (window.Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      // Cancel any existing reminder
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {})

      const now = new Date()
      const scheduledTime = new Date()
      scheduledTime.setHours(hour, 0, 0, 0)

      // If already past the chosen hour today → schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '🛒 ניהול קניות',
            body: 'זמן להכניס את הוצאות היום! אל תשכח לתעד את הקניות.',
            schedule: { at: scheduledTime, repeats: true, every: 'day' },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1d4ed8',
          },
        ],
      })
      return true
    }

    // Web: store preference, checkWebNotificationTime() will fire it
    return true
  } catch (e) {
    console.warn('Schedule notification error:', e)
    return false
  }
}

export function cancelDailyReminder() {
  try {
    localStorage.setItem('notifications_enabled', 'false')
    if (window.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
        LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      })
    }
  } catch (e) {}
}

export async function sendTestNotification() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      // Schedule 2 seconds from now
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99,
            title: '🛒 ניהול קניות — בדיקה',
            body: 'התראות עובדות בהצלחה! 🎉',
            schedule: { at: new Date(Date.now() + 2000) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1d4ed8',
          },
        ],
      })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛒 ניהול קניות — בדיקה', {
        body: 'התראות עובדות בהצלחה! 🎉',
        icon: '/vite.svg',
      })
    }
  } catch (e) {
    console.warn('Test notification error:', e)
  }
}

// Called on every web app load — fires only at the chosen hour, once per day
export function checkWebNotificationTime() {
  if (window.Capacitor?.isNativePlatform?.()) return // native handles scheduling
  if (localStorage.getItem('notifications_enabled') !== 'true') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const lastShown = localStorage.getItem('notification_last_shown')
  const today = new Date().toDateString()
  if (lastShown === today) return // already shown today

  const hour = parseInt(localStorage.getItem('notification_hour') || '20', 10)
  const now = new Date()

  // Only fire if current hour matches the chosen hour (within the same hour)
  if (now.getHours() === hour) {
    new Notification('🛒 ניהול קניות', {
      body: 'זמן להכניס את הוצאות היום! אל תשכח לתעד את הקניות.',
      icon: '/vite.svg',
    })
    localStorage.setItem('notification_last_shown', today)
  }
}
