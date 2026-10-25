package com.dueltheory

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(ScreenAwakePlugin::class.java)
        super.onCreate(savedInstanceState)
        // Small battlefield cards are previews; their readable text is in the viewer.
        // WebView's 8px floor otherwise enlarges their text beyond the card frame.
        bridge?.webView?.settings?.apply {
            minimumFontSize = 1
            minimumLogicalFontSize = 1
        }
    }
}
