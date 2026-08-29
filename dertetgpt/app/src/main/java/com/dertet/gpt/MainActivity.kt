package com.dertet.gpt

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.dertet.gpt.ui.AppRoot
import com.dertet.gpt.ui.theme.DertetGptTheme
import com.dertet.gpt.util.wrapWithStoredLocale

class MainActivity : ComponentActivity() {
    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(newBase.wrapWithStoredLocale())
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as DertetGptApp).container
        setContent {
            DertetGptTheme {
                AppRoot(container = container)
            }
        }
    }
}
