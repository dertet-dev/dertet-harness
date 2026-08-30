package com.dertet.harness

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.dertet.harness.ui.AppRoot
import com.dertet.harness.ui.theme.DertetHarnessTheme
import com.dertet.harness.util.wrapWithStoredLocale

class MainActivity : ComponentActivity() {
    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(newBase.wrapWithStoredLocale())
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as DertetHarnessApp).container
        setContent {
            DertetHarnessTheme {
                AppRoot(container = container)
            }
        }
    }
}
