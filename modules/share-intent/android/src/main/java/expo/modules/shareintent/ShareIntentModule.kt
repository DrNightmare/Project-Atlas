package expo.modules.shareintent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID

class ShareIntentModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ShareIntent")

    Events("onShareIntent")

    Function("getSharedContent") {
      val activity = appContext.currentActivity
      val intent = activity?.intent
      val content = processIntent(intent)
      if (content != null) {
          // Clear the intent to prevent processing it again on reload/remount
          activity?.intent = null
      }
      return@Function content
    }

    OnNewIntent { intent ->
      val content = processIntent(intent)
      if (content != null) {
        sendEvent("onShareIntent", mapOf("content" to content))
      }
    }
  }

  private fun processIntent(intent: Intent?): String? {
    if (intent == null) return null
    val action = intent.action
    val type = intent.type

    if (Intent.ACTION_SEND == action && type != null) {
      if (type.startsWith("image/") || type == "application/pdf") {
        val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
        if (uri != null) {
          return copyToTemp(uri)
        }
      }
    }
    return null
  }

  private fun copyToTemp(uri: Uri): String? {
    try {
      val context = appContext.reactContext ?: return null
      val contentResolver = context.contentResolver
      val mimeType = contentResolver.getType(uri)
      val extension = when {
          mimeType?.contains("pdf") == true -> "pdf"
          mimeType?.contains("jpeg") == true -> "jpg"
          mimeType?.contains("png") == true -> "png"
          mimeType?.contains("image") == true -> "jpg" // fallback
          else -> "tmp"
      }
      val filename = "share_${UUID.randomUUID()}.$extension"
      val outputFile = File(context.cacheDir, filename)

      val inputStream: InputStream? = contentResolver.openInputStream(uri)
      val outputStream = FileOutputStream(outputFile)

      inputStream?.use { input ->
        outputStream.use { output ->
          input.copyTo(output)
        }
      }
      
      return outputFile.absolutePath
    } catch (e: Exception) {
      e.printStackTrace()
      return null
    }
  }
}
