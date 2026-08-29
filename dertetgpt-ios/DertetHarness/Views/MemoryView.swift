import SwiftUI

struct MemoryView: View {
    @ObservedObject var viewModel: MemoryViewModel
    let onBack: () -> Void

    @State private var newText = ""
    @State private var showClearConfirm = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if viewModel.memories.isEmpty {
                    Spacer()
                    Text(L("memory_empty"))
                        .foregroundColor(Theme.onSurfaceMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    Spacer()
                } else {
                    List {
                        ForEach(viewModel.memories) { memory in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(memory.content).foregroundColor(Theme.onBackground)
                                if memory.source == "ai" {
                                    Text(L("memory_source_ai"))
                                        .font(.caption)
                                        .foregroundColor(Theme.onSurfaceMuted)
                                }
                            }
                            .listRowBackground(Theme.surface)
                        }
                        .onDelete { indexSet in
                            for index in indexSet { viewModel.delete(viewModel.memories[index]) }
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }

                HStack {
                    TextField(L("memory_add_hint"), text: $newText)
                        .padding(10)
                        .background(Theme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    Button(L("memory_add_button")) {
                        viewModel.addManual(newText)
                        newText = ""
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Theme.primary)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(12)
            }
            .background(Theme.background)
            .navigationTitle(L("memory_title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: onBack) { Image(systemName: "chevron.left") }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !viewModel.memories.isEmpty {
                        Button(action: { showClearConfirm = true }) {
                            Image(systemName: "trash")
                        }
                    }
                }
            }
        }
        .confirmationDialog(L("memory_clear_confirm"), isPresented: $showClearConfirm, titleVisibility: .visible) {
            Button(L("memory_clear_all"), role: .destructive) { viewModel.clearAll() }
            Button(L("action_cancel"), role: .cancel) {}
        }
    }
}
