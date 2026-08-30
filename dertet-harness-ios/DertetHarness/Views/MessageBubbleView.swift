import SwiftUI
import UIKit

struct MessageBubbleView: View {
    let message: UiMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 40) }
            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                if !message.attachments.isEmpty {
                    attachmentsRow
                }
                if !message.content.isEmpty || message.isStreaming {
                    bubble
                }
                if !isUser && !message.isStreaming && !message.content.isEmpty {
                    Button(action: copy) {
                        Image(systemName: "doc.on.doc")
                            .font(.footnote)
                            .foregroundColor(Theme.onSurfaceMuted)
                    }
                }
            }
            if !isUser { Spacer(minLength: 40) }
        }
    }

    private var bubble: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(message.content.isEmpty ? "…" : message.content)
                .foregroundColor(textColor)
                .textSelection(.enabled)
            if message.isStreaming {
                TypingDotsView()
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(bubbleColor)
        .clipShape(RoundedCorner(radius: 18, corners: isUser
            ? [.topLeft, .topRight, .bottomLeft]
            : [.topLeft, .topRight, .bottomRight]))
    }

    private var textColor: Color {
        if message.isError { return Theme.error }
        return isUser ? .white : Theme.onBackground
    }

    private var bubbleColor: Color {
        if message.isError { return Theme.error.opacity(0.15) }
        return isUser ? Theme.primary.opacity(0.9) : Theme.surface
    }

    private var attachmentsRow: some View {
        HStack(spacing: 6) {
            ForEach(message.attachments.prefix(4)) { att in
                if att.kind == .image, let b64 = att.base64Data, let data = Data(base64Encoded: b64), let ui = UIImage(data: data) {
                    Image(uiImage: ui)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: 96, maxHeight: 120)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "doc")
                        Text(att.fileName).lineLimit(1)
                    }
                    .font(.footnote)
                    .foregroundColor(Theme.onSurfaceMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(Theme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private func copy() {
        UIPasteboard.general.string = message.content
    }
}

private struct TypingDotsView: View {
    @State private var animating = false

    var body: some View {
        Text("●●●")
            .font(.caption.weight(.medium))
            .foregroundColor(Theme.secondary.opacity(animating ? 1.0 : 0.3))
            .onAppear {
                withAnimation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true)) {
                    animating = true
                }
            }
    }
}

/// Rounds only the specified corners, matching the Android bubble shape (sharp on the "pointer" corner).
struct RoundedCorner: Shape {
    var radius: CGFloat = 18
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
