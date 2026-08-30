import SwiftUI
import SwiftData

@main
struct DertetHarnessApp: App {
    var body: some Scene {
        WindowGroup {
            AppRootView()
                .preferredColorScheme(.dark)
        }
        .modelContainer(PersistenceController.sharedContainer)
    }
}
