package com.dueltheory

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(ScreenAwakePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
