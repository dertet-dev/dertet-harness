import SwiftUI

struct ModelPickerView: View {
    let current: String
    let suggestions: [String]
    let loading: Bool
    let onRefresh: () -> Void
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    private var filtered: [String] {
        query.isEmpty ? suggestions : suggestions.filter { $0.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundColor(Theme.onSurfaceMuted)
                    TextField(L("settings_model_search_hint"), text: $query)
                        .foregroundColor(Theme.onBackground)
                }
                .padding(10)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)
                .padding(.top, 8)

                List {
                    if !query.isEmpty && !suggestions.contains(where: { $0.caseInsensitiveCompare(query) == .orderedSame }) {
                        Button(action: { onSelect(query.trimmingCharacters(in: .whitespaces)); dismiss() }) {
                            Text(Lf("settings_model_use_custom", query))
                                .foregroundColor(Theme.onBackground)
                        }
                        .listRowBackground(Theme.background)
                    }
                    if filtered.isEmpty && !query.isEmpty {
                        Text(L("settings_model_none_found"))
                            .foregroundColor(Theme.onSurfaceMuted)
                            .listRowBackground(Theme.background)
                    }
                    ForEach(filtered, id: \.self) { model in
                        Button(action: { onSelect(model); dismiss() }) {
                            Text(model)
                                .foregroundColor(model == current ? Theme.primary : Theme.onBackground)
                        }
                        .listRowBackground(Theme.background)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
            .background(Theme.background)
            .navigationTitle(L("settings_model"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if loading {
                        ProgressView()
                    } else {
                        Button(action: onRefresh) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
