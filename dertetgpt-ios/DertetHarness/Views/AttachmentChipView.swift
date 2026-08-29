import SwiftUI
import UIKit

struct AttachmentChipView: View {
    let attachment: Attachment
    let onRemove: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if attachment.kind == .image, let b64 = attachment.base64Data,
                   let data = Data(base64Encoded: b64), let ui = UIImage(data: data) {
                    Image(uiImage: ui)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "doc")
                        Text(attachment.fileName).lineLimit(1)
                    }
                    .font(.footnote)
                    .frame(maxWidth: 120)
                    .padding(6)
                }
            }
            .padding(6)
            .background(Theme.surfaceHigh)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Theme.onSurfaceMuted)
                    .padding(4)
                    .background(Theme.surfaceHigh)
                    .clipShape(Circle())
            }
            .offset(x: 4, y: -4)
        }
    }
}
