import SwiftUI
import PhotosUI
import UIKit

struct ChatInputBarView: View {
    @Binding var text: String
    let attachments: [Attachment]
    let onRemoveAttachment: (Attachment) -> Void
    let onAddAttachment: (Attachment) -> Void
    let isSending: Bool
    let onSend: () -> Void
    let onStop: () -> Void

    @State private var photoItems: [PhotosPickerItem] = []
    @State private var showCamera = false
    @State private var showFileImporter = false

    private var canSend: Bool { !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !attachments.isEmpty }

    var body: some View {
        VStack(spacing: 8) {
            if !attachments.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(attachments) { att in
                            AttachmentChipView(attachment: att, onRemove: { onRemoveAttachment(att) })
                        }
                    }
                }
            }

            HStack(alignment: .bottom, spacing: 4) {
                Menu {
                    Button(action: { showCamera = true }) {
                        Label(L("attach_camera"), systemImage: "camera")
                    }
                    PhotosPicker(selection: $photoItems, maxSelectionCount: 6, matching: .images) {
                        Label(L("attach_photo"), systemImage: "photo")
                    }
                    Button(action: { showFileImporter = true }) {
                        Label(L("attach_file"), systemImage: "doc")
                    }
                } label: {
                    Image(systemName: "plus")
                        .foregroundColor(Theme.onSurfaceMuted)
                        .frame(width: 40, height: 40)
                }

                TextField(L("message_input_hint"), text: $text, axis: .vertical)
                    .lineLimit(1...6)
                    .padding(.vertical, 8)
                    .foregroundColor(Theme.onBackground)

                Button(action: { isSending ? onStop() : (canSend ? onSend() : ()) }) {
                    Image(systemName: isSending ? "stop.fill" : "arrow.up")
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(isSending ? Theme.error : (canSend ? Theme.primary : Theme.surfaceHigh))
                        .clipShape(Circle())
                }
                .padding(2)
            }
            .padding(4)
            .background(Theme.surfaceHigh)
            .overlay(
                RoundedRectangle(cornerRadius: 26).stroke(Theme.outline, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 26))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.background)
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(onCapture: { image in
                if let data = image.jpegData(compressionQuality: 0.9),
                   let attachment = AttachmentLoader.fromImageData(data, fileName: "camera_\(Int(Date().timeIntervalSince1970)).jpg") {
                    onAddAttachment(attachment)
                }
            })
            .ignoresSafeArea()
        }
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: [.item], allowsMultipleSelection: true) { result in
            if case .success(let urls) = result {
                for url in urls {
                    if let attachment = AttachmentLoader.fromFileURL(url) {
                        onAddAttachment(attachment)
                    }
                }
            }
        }
        .onChange(of: photoItems) { _, newItems in
            for item in newItems {
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let attachment = AttachmentLoader.fromImageData(data, fileName: "photo_\(Int(Date().timeIntervalSince1970)).jpg") {
                        onAddAttachment(attachment)
                    }
                }
            }
            photoItems = []
        }
    }
}
