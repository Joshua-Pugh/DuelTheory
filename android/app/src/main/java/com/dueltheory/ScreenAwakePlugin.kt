package com.dueltheory

import android.view.WindowManager
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ScreenAwake")
class ScreenAwakePlugin : Plugin() {
    private var requested = false
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
    override fun handleOnResume() { applyAwake(requested) }
    override fun handleOnDestroy() { requested = false; applyAwake(false) }
}
