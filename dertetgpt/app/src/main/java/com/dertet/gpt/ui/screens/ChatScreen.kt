package com.dertet.gpt.ui.screens

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.dertet.gpt.R
import com.dertet.gpt.ui.ChatViewModel
import com.dertet.gpt.ui.GeneratedImage
import com.dertet.gpt.ui.components.ChatInputBar
import com.dertet.gpt.ui.components.ImageViewerDialog
import com.dertet.gpt.ui.components.MessageBubble
import com.dertet.gpt.ui.theme.DertetOnSurfaceMuted
import com.dertet.gpt.ui.theme.DertetPrimary
import com.dertet.gpt.ui.theme.DertetSurfaceHigh
import com.dertet.gpt.util.loadAttachmentFromUri
import kotlinx.coroutines.launch
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onOpenDrawer: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current
    val messages by viewModel.messages.collectAsState()
    val isSending by viewModel.isSending.collectAsState()
    val settings by viewModel.settingsState.collectAsState()
    val editingMessageId by viewModel.editingMessageId.collectAsState()
    val searchingQuery by viewModel.searchingQuery.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val listState = rememberLazyListState()
    val noKeyMessage = stringResource(R.string.snackbar_no_key)
    val voiceUnavailableMessage = stringResource(R.string.voice_input_unavailable)
    var viewerImage by remember { mutableStateOf<GeneratedImage?>(null) }

    LaunchedEffect(messages.size, messages.lastOrNull()?.content) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.errorEvents.collect { event ->
            if (event == "no_key") {
                snackbarHostState.showSnackbar(noKeyMessage)
            } else {
                snackbarHostState.showSnackbar(event)
            }
        }
    }

    val pickImages = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        uris.forEach { uri ->
            scope.launch {
                loadAttachmentFromUri(context, uri)?.let { viewModel.addAttachment(it) }
            }
        }
    }
    val pickFiles = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        uris.forEach { uri ->
            scope.launch {
                loadAttachmentFromUri(context, uri)?.let { viewModel.addAttachment(it) }
            }
        }
    }

    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        val uri = pendingCameraUri
        if (success && uri != null) {
            scope.launch {
                loadAttachmentFromUri(context, uri)?.let { viewModel.addAttachment(it) }
            }
        }
    }

    val speechLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val recognized = result.data
                ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                ?.firstOrNull()
            if (!recognized.isNullOrBlank()) {
                val current = viewModel.inputText.value
                viewModel.inputText.value = if (current.isBlank()) recognized else "$current $recognized"
            }
        }
    }

    Scaffold(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Dertet Harness", fontWeight = FontWeight.SemiBold)
                        if (settings != null) {
                            Text(
                                text = settings!!.model,
                                style = MaterialTheme.typography.bodyMedium,
                                color = DertetOnSurfaceMuted
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        focusManager.clearFocus()
                        onOpenDrawer()
                    }) {
                        Icon(Icons.Filled.Menu, contentDescription = stringResource(R.string.menu_desc))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        bottomBar = {
            Column {
                if (editingMessageId != null) {
                    EditModeBanner(onCancel = { viewModel.cancelEditing() })
                }
                if (searchingQuery != null) {
                    SearchingBanner(query = searchingQuery!!)
                }
                ChatInputBar(
                    text = viewModel.inputText.value,
                    onTextChange = { viewModel.inputText.value = it },
                    attachments = viewModel.pendingAttachments,
                    onRemoveAttachment = { viewModel.removeAttachment(it) },
                    onPickImage = { pickImages.launch(arrayOf("image/*")) },
                    onPickFile = { pickFiles.launch(arrayOf("*/*")) },
                    onPickCamera = {
                        val dir = File(context.cacheDir, "attachments").apply { mkdirs() }
                        val file = File(dir, "camera_${System.currentTimeMillis()}.jpg")
                        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                        pendingCameraUri = uri
                        cameraLauncher.launch(uri)
                    },
                    onVoiceInput = {
                        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        }
                        try {
                            speechLauncher.launch(intent)
                        } catch (e: ActivityNotFoundException) {
                            scope.launch { snackbarHostState.showSnackbar(voiceUnavailableMessage) }
                        }
                    },
                    isSending = isSending,
                    onSend = { viewModel.sendMessage() },
                    onStop = { viewModel.stopGenerating() }
                )
            }
        }
    ) { padding ->
        if (messages.isEmpty()) {
            EmptyChatState(
                hasKey = !settings?.apiKey.isNullOrBlank(),
                onOpenSettings = onOpenSettings,
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
            )
        } else {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    MessageBubble(
                        message = msg,
                        modifier = Modifier.fillMaxWidth(),
                        onEditRequested = { viewModel.startEditingMessage(it) },
                        onImageClick = { viewerImage = it }
                    )
                }
            }
        }
    }

    viewerImage?.let { image ->
        ImageViewerDialog(image = image, onDismiss = { viewerImage = null })
    }
}

@Composable
private fun EditModeBanner(onCancel: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(DertetSurfaceHigh)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Filled.Edit, contentDescription = null, tint = DertetPrimary, modifier = Modifier.size(16.dp))
        Text(
            text = stringResource(R.string.edit_mode_banner),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier
                .weight(1f)
                .padding(start = 8.dp)
        )
        IconButton(onClick = onCancel, modifier = Modifier.size(20.dp)) {
            Icon(
                Icons.Filled.Close,
                contentDescription = stringResource(R.string.edit_mode_cancel_desc),
                tint = DertetOnSurfaceMuted
            )
        }
    }
}

@Composable
private fun SearchingBanner(query: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(DertetSurfaceHigh)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Filled.Search, contentDescription = null, tint = DertetPrimary, modifier = Modifier.size(16.dp))
        Text(
            text = stringResource(R.string.searching_indicator, query),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
            maxLines = 1,
            modifier = Modifier
                .weight(1f)
                .padding(start = 8.dp)
        )
        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
    }
}

@Composable
private fun EmptyChatState(hasKey: Boolean, onOpenSettings: () -> Unit, modifier: Modifier = Modifier) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = stringResource(R.string.empty_chat_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold
            )
            if (!hasKey) {
                Row(modifier = Modifier.padding(top = 8.dp)) {
                    Text(
                        text = stringResource(R.string.empty_chat_subtitle),
                        color = DertetOnSurfaceMuted,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}
