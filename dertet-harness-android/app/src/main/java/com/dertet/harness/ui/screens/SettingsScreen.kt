package com.dertet.harness.ui.screens

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.dertet.harness.R
import com.dertet.harness.data.settings.AppLanguage
import com.dertet.harness.data.settings.ProviderType
import com.dertet.harness.ui.SettingsViewModel
import com.dertet.harness.ui.theme.DertetOnSurfaceMuted
import com.dertet.harness.ui.theme.DertetPrimary
import com.dertet.harness.ui.theme.DertetSurface
import com.dertet.harness.ui.theme.DertetSurfaceHigh
import com.dertet.harness.util.LocalePrefs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
    onOpenMemory: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Scaffold(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState())
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Text(stringResource(R.string.settings_provider), style = MaterialTheme.typography.labelLarge, color = DertetOnSurfaceMuted)
            ProviderDropdown(
                selected = viewModel.selectedProvider,
                onSelect = { viewModel.onProviderSelected(it) }
            )

            if (viewModel.selectedProvider.editableBaseUrl) {
                OutlinedTextField(
                    value = viewModel.baseUrl,
                    onValueChange = { viewModel.baseUrl = it },
                    label = { Text("Base URL") },
                    placeholder = { Text("https://api.example.com/v1") },
                    singleLine = true,
                    colors = fieldColors(),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            var keyVisible by remember { mutableStateOf(false) }
            OutlinedTextField(
                value = viewModel.apiKey,
                onValueChange = { viewModel.apiKey = it },
                label = { Text(stringResource(R.string.settings_api_key)) },
                placeholder = { Text(stringResource(R.string.settings_api_key_hint)) },
                singleLine = true,
                visualTransformation = if (keyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { keyVisible = !keyVisible }) {
                        Icon(
                            if (keyVisible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = null
                        )
                    }
                },
                colors = fieldColors(),
                modifier = Modifier.fillMaxWidth()
            )

            ModelPickerField(
                model = viewModel.model,
                onModelChange = { viewModel.model = it },
                suggestions = (viewModel.availableModels.ifEmpty { viewModel.selectedProvider.knownModels }),
                loading = viewModel.modelsLoading,
                onRefresh = { viewModel.refreshModels() }
            )

            OutlinedTextField(
                value = viewModel.systemPrompt,
                onValueChange = { viewModel.systemPrompt = it },
                label = { Text(stringResource(R.string.settings_system_prompt)) },
                placeholder = { Text(stringResource(R.string.settings_system_prompt_hint)) },
                minLines = 3,
                maxLines = 6,
                colors = fieldColors(),
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = { viewModel.save() },
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = DertetPrimary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(stringResource(if (viewModel.justSaved) R.string.settings_saved else R.string.settings_save))
            }

            Text(stringResource(R.string.settings_language), style = MaterialTheme.typography.labelLarge, color = DertetOnSurfaceMuted)
            LanguageDropdown(
                onSelect = { lang ->
                    LocalePrefs.setTag(context, lang.tag)
                    (context as? Activity)?.recreate()
                }
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(DertetSurface)
                    .clickable(onClick = onOpenMemory)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Psychology, contentDescription = null, tint = DertetPrimary)
                Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
                    Text(stringResource(R.string.memory_title), style = MaterialTheme.typography.titleMedium)
                    Text(
                        stringResource(R.string.memory_row_subtitle),
                        style = MaterialTheme.typography.bodyMedium,
                        color = DertetOnSurfaceMuted
                    )
                }
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = DertetOnSurfaceMuted)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProviderDropdown(selected: ProviderType, onSelect: (ProviderType) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selected.displayName,
            onValueChange = {},
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = fieldColors(),
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            ProviderType.entries.forEach { provider ->
                DropdownMenuItem(
                    text = { Text(provider.displayName) },
                    onClick = { onSelect(provider); expanded = false }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LanguageDropdown(onSelect: (AppLanguage) -> Unit) {
    val context = LocalContext.current
    var expanded by remember { mutableStateOf(false) }
    var current by remember { mutableStateOf(AppLanguage.fromTag(LocalePrefs.getTag(context))) }
    val systemLabel = stringResource(R.string.settings_language_system)
    fun labelFor(lang: AppLanguage) = if (lang == AppLanguage.SYSTEM) systemLabel else lang.nativeName
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = labelFor(current),
            onValueChange = {},
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = fieldColors(),
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            AppLanguage.entries.forEach { lang ->
                DropdownMenuItem(
                    text = { Text(labelFor(lang)) },
                    onClick = {
                        current = lang
                        expanded = false
                        onSelect(lang)
                    }
                )
            }
        }
    }
}

@Composable
private fun ModelPickerField(
    model: String,
    onModelChange: (String) -> Unit,
    suggestions: List<String>,
    loading: Boolean,
    onRefresh: () -> Unit
) {
    var showPicker by remember { mutableStateOf(false) }
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }

    OutlinedTextField(
        value = model,
        onValueChange = {},
        readOnly = true,
        enabled = false,
        label = { Text(stringResource(R.string.settings_model)) },
        placeholder = { Text(stringResource(R.string.settings_model_hint)) },
        singleLine = true,
        trailingIcon = {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Icon(Icons.Filled.Search, contentDescription = null, tint = DertetOnSurfaceMuted)
            }
        },
        colors = fieldColors().copy(
            disabledTextColor = MaterialTheme.colorScheme.onSurface,
            disabledContainerColor = DertetSurface,
            disabledLabelColor = DertetOnSurfaceMuted,
            disabledPlaceholderColor = DertetOnSurfaceMuted
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(interactionSource = interactionSource, indication = null) { showPicker = true }
    )

    if (showPicker) {
        ModelPickerDialog(
            current = model,
            suggestions = suggestions,
            loading = loading,
            onRefresh = onRefresh,
            onSelect = { onModelChange(it); showPicker = false },
            onDismiss = { showPicker = false }
        )
    }
}

@Composable
private fun ModelPickerDialog(
    current: String,
    suggestions: List<String>,
    loading: Boolean,
    onRefresh: () -> Unit,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(query, suggestions) {
        if (query.isBlank()) suggestions else suggestions.filter { it.contains(query, ignoreCase = true) }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            color = MaterialTheme.colorScheme.background,
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.82f)
                .padding(vertical = 12.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text(
                        stringResource(R.string.settings_model),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f)
                    )
                    if (loading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        IconButton(onClick = onRefresh) {
                            Icon(Icons.Filled.Refresh, contentDescription = stringResource(R.string.settings_model_refresh_desc))
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Filled.Close, contentDescription = null)
                    }
                }

                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    singleLine = true,
                    placeholder = { Text(stringResource(R.string.settings_model_search_hint)) },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    colors = fieldColors(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp, bottom = 8.dp)
                )

                LazyColumn(modifier = Modifier.weight(1f)) {
                    if (query.isNotBlank() && suggestions.none { it.equals(query, ignoreCase = true) }) {
                        item {
                            ModelRow(
                                text = stringResource(R.string.settings_model_use_custom, query),
                                selected = false,
                                onClick = { onSelect(query.trim()) }
                            )
                        }
                    }
                    if (filtered.isEmpty() && query.isNotBlank()) {
                        item {
                            Text(
                                stringResource(R.string.settings_model_none_found),
                                color = DertetOnSurfaceMuted,
                                modifier = Modifier.padding(vertical = 16.dp)
                            )
                        }
                    }
                    items(filtered, key = { it }) { m ->
                        ModelRow(text = m, selected = m == current, onClick = { onSelect(m) })
                    }
                }
            }
        }
    }
}

@Composable
private fun ModelRow(text: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) DertetSurfaceHigh else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 14.dp)
    ) {
        Text(
            text = text,
            color = if (selected) DertetPrimary else MaterialTheme.colorScheme.onSurface,
            style = MaterialTheme.typography.bodyLarge
        )
    }
}

@Composable
private fun fieldColors() = TextFieldDefaults.colors(
    focusedContainerColor = DertetSurface,
    unfocusedContainerColor = DertetSurface,
    focusedIndicatorColor = DertetPrimary,
    unfocusedIndicatorColor = Color.Transparent,
    disabledIndicatorColor = Color.Transparent
)
