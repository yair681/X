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

    if (window.Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      await LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {})

      const now = new Date()
      const scheduledTime = new Date()
      scheduledTime.setHours(hour, 0, 0, 0)
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '🛒 תקציב סופר',
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

    localStorage.setItem('notifications_enabled', 'true')
    return true
  } catch (e) {
    console.warn('Schedule notification error:', e)
    return false
  }
}

export function cancelDailyReminder() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
        LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      })
    }
    localStorage.removeItem('notifications_enabled')
  } catch (e) {}
}

export async function sendTestNotification() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99,
            title: '🛒 תקציב סופר — בדיקה',
            body: 'התראות עובדות בהצלחה! 🎉',
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1d4ed8',
          },
        ],
      })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛒 תקציב סופר — בדיקה', {
        body: 'התראות עובדות בהצלחה! 🎉',
        icon: '/vite.svg',
      })
    }
  } catch (e) {
    console.warn('Test notification error:', e)
  }
}

export function checkWebNotificationTime() {
  if (window.Capacitor?.isNativePlatform?.()) return
  if (localStorage.getItem('notifications_enabled') !== 'true') return
  if (Notification?.permission !== 'granted') return

  const lastShown = localStorage.getItem('notification_last_shown')
  const today = new Date().toDateString()
  if (lastShown === today) return

  const hour = parseInt(localStorage.getItem('notification_hour') || '20', 10)
  const now = new Date()
  if (now.getHours() >= hour) {
    new Notification('🛒 תקציב סופר', {
      body: 'זמן להכניס את הוצאות היום! אל תשכח לתעד את הקניות.',
      icon: '/vite.svg',
    })
    localStorage.setItem('notification_last_shown', today)
  }
}
