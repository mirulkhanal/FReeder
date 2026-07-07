package com.freeder

import android.content.Intent
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ShareFileModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "FreederFileShare"

  @ReactMethod
  fun shareFile(path: String, mimeType: String, title: String, promise: Promise) {
    try {
      val activity = reactApplicationContext.getCurrentActivity()

      val filePath = path.removePrefix("file://")
      val file = File(filePath)
      if (!file.exists()) {
        promise.reject("NOT_FOUND", "File not found: $filePath")
        return
      }

      val authority = "${reactApplicationContext.packageName}.fileprovider"
      val uri = FileProvider.getUriForFile(reactApplicationContext, authority, file)

      val sendIntent =
        Intent(Intent.ACTION_SEND).apply {
          type = mimeType
          putExtra(Intent.EXTRA_STREAM, uri)
          putExtra(Intent.EXTRA_SUBJECT, title)
          putExtra(Intent.EXTRA_TITLE, title)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

      val chooser = Intent.createChooser(sendIntent, title)
      chooser.addCategory(Intent.CATEGORY_DEFAULT)

      if (activity != null) {
        activity.startActivity(chooser)
      } else {
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(chooser)
      }

      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SHARE_FAILED", error.message, error)
    }
  }
}
