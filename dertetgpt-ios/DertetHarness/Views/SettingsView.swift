import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    let onBack: () -> Void
    let onOpenMemory: () -> Void

    @ObservedObject private var loc = LocalizationManager.shared
    @State private var keyVisible = false
    @State private var showModelPicker = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker(L("settings_provider"), selection: Binding(
                        get: { viewModel.selectedProvider },
                        set: { viewModel.onProviderSelected($0) }
                    )) {
                        ForEach(ProviderType.allCases) { provider in
                            Text(provider.displayName).tag(provider)
                        }
                    }
                    .tint(Theme.primary)

                    if viewModel.selectedProvider.editableBaseUrl {
                        TextField("Base URL", text: $viewModel.baseUrl)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .keyboardType(.URL)
                    }

                    HStack {
                        if keyVisible {
                            TextField(L("settings_api_key_hint"), text: $viewModel.apiKey)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        } else {
                            SecureField(L("settings_api_key_hint"), text: $viewModel.apiKey)
                        }
                        Button(action: { keyVisible.toggle() }) {
                            Image(systemName: keyVisible ? "eye.slash" : "eye")
                                .foregroundColor(Theme.onSurfaceMuted)
                        }
                    }

                    Button(action: { showModelPicker = true }) {
                        HStack {
                            Text(L("settings_model"))
                                .foregroundColor(Theme.onBackground)
                            Spacer()
                            Text(viewModel.model.isEmpty ? L("settings_model_hint") : viewModel.model)
                                .foregroundColor(Theme.onSurfaceMuted)
                                .lineLimit(1)
                            if viewModel.modelsLoading {
                                ProgressView().padding(.leading, 4)
                            }
                        }
                    }
                } header: {
                    Text(L("settings_provider")).textCase(nil)
                }
                .listRowBackground(Theme.surface)

                Section {
                    TextField(L("settings_system_prompt_hint"), text: $viewModel.systemPrompt, axis: .vertical)
                        .lineLimit(3...6)
                } header: {
                    Text(L("settings_system_prompt")).textCase(nil)
                }
                .listRowBackground(Theme.surface)

                Section {
                    Button(action: { viewModel.save() }) {
                        Text(viewModel.justSaved ? L("settings_saved") : L("settings_save"))
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Theme.primary)
                }

                Section {
                    Picker(L("settings_language"), selection: $loc.language) {
                        ForEach(AppLanguage.allCases) { lang in
                            Text(lang == .system ? L("settings_language_system") : lang.nativeName).tag(lang)
                        }
                    }
                    .tint(Theme.primary)
                } header: {
                    Text(L("settings_language")).textCase(nil)
                }
                .listRowBackground(Theme.surface)

                Section {
                    Button(action: onOpenMemory) {
                        HStack {
                            Image(systemName: "brain").foregroundColor(Theme.primary)
                            VStack(alignment: .leading) {
                                Text(L("memory_title")).foregroundColor(Theme.onBackground)
                                Text(L("memory_row_subtitle")).font(.caption).foregroundColor(Theme.onSurfaceMuted)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundColor(Theme.onSurfaceMuted)
                        }
                    }
                }
                .listRowBackground(Theme.surface)
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle(L("settings"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: onBack) {
                        Image(systemName: "chevron.left")
                    }
                }
            }
        }
        .sheet(isPresented: $showModelPicker) {
            ModelPickerView(
                current: viewModel.model,
                suggestions: viewModel.availableModels.isEmpty ? viewModel.selectedProvider.knownModels : viewModel.availableModels,
                loading: viewModel.modelsLoading,
                onRefresh: { viewModel.refreshModels() },
                onSelect: { viewModel.model = $0 }
            )
        }
        .id(loc.language)
    }
}
