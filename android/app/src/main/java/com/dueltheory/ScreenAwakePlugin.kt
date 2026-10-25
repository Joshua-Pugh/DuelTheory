package com.dueltheory

import android.view.WindowManager
import android.content.pm.ActivityInfo
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ScreenAwake")
class ScreenAwakePlugin : Plugin() {
    private var requested = false
    private var duelMode = false
    private fun applyDuelMode(enabled: Boolean) {
        activity.runOnUiThread {
            activity.requestedOrientation = if (enabled)
                ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            val controller = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
            if (enabled) {
                controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                controller.hide(WindowInsetsCompat.Type.systemBars())
            } else controller.show(WindowInsetsCompat.Type.systemBars())
        }
    }
    @PluginMethod
    fun setDuelMode(call: PluginCall) {
        duelMode = call.getBoolean("enabled", false) ?: false
        applyDuelMode(duelMode)
        call.resolve()
    }
    private fun applyAwake(enabled: Boolean) {
        activity.runOnUiThread {
            if (enabled) activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    @PluginMethod
    fun setEnabled(call: PluginCall) {
        requested = call.getBoolean("enabled", false) ?: false
        applyAwake(requested)
        call.resolve()
    }
    override fun handleOnPause() { applyAwake(false) }
    override fun handleOnResume() { applyAwake(requested); applyDuelMode(duelMode) }
    override fun handleOnDestroy() { requested = false; duelMode = false; applyAwake(false) }
}
