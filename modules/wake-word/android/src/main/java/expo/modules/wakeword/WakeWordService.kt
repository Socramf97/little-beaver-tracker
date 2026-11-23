package expo.modules.wakeword

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

class WakeWordService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    createChannel()

    // Tapping the persistent notification opens the app
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val tapIntent = PendingIntent.getActivity(
      this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Little Beaver is listening")
      .setContentText("Say \"Hey Beaver\" anytime")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setContentIntent(tapIntent)
      .build()

    // "I'm a foreground service using the microphone": keeps mic access in the background
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      notification,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
      else 0
    )
    return START_NOT_STICKY
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID, "Wake word listening", NotificationManager.IMPORTANCE_LOW
      )
      getSystemService(NotificationManager::class.java)
        .createNotificationChannel(channel)
    }
  }

  companion object {
    const val CHANNEL_ID = "wake_word_service"
    const val NOTIFICATION_ID = 4242

    fun start(context: Context) {
      ContextCompat.startForegroundService(
        context, Intent(context, WakeWordService::class.java)
      )
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, WakeWordService::class.java))
    }
  }
}