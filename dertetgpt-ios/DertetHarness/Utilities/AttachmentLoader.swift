import UIKit
import UniformTypeIdentifiers

enum AttachmentLoader {
    static let maxImageDimension: CGFloat = 1536
    static let maxTextChars = 60_000
    static let textExtensions: Set<String> = [
        "txt", "md", "markdown", "json", "csv", "xml", "html", "htm", "kt", "java",
        "py", "js", "ts", "tsx", "jsx", "c", "cpp", "h", "hpp", "cs", "go", "rs",
        "yaml", "yml", "gradle", "properties", "log", "sh", "bat", "sql", "css", "swift"
    ]

    static func fromImageData(_ data: Data, fileName: String) -> Attachment? {
        guard let image = UIImage(data: data) else { return nil }
        let scaled = downscale(image, maxDimension: maxImageDimension)
        guard let jpegData = scaled.jpegData(compressionQuality: 0.85) else { return nil }
        return Attachment(
            fileName: fileName,
            mimeType: "image/jpeg",
            kind: .image,
            base64Data: jpegData.base64EncodedString()
        )
    }

    static func fromFileURL(_ url: URL) -> Attachment? {
        let fileName = url.lastPathComponent
        let ext = (fileName as NSString).pathExtension.lowercased()
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }

        let type = UTType(filenameExtension: ext)

        if type?.conforms(to: .image) == true, let data = try? Data(contentsOf: url) {
            return fromImageData(data, fileName: fileName)
        }

        if textExtensions.contains(ext) || type?.conforms(to: .text) == true {
            if let data = try? Data(contentsOf: url), let text = String(data: data, encoding: .utf8) {
                let trimmed = String(text.prefix(maxTextChars))
                return Attachment(
                    fileName: fileName,
                    mimeType: type?.preferredMIMEType ?? "text/plain",
                    kind: .file,
                    textContent: trimmed
                )
            }
        }

        let mime = type?.preferredMIMEType ?? "application/octet-stream"
        return Attachment(fileName: fileName, mimeType: mime, kind: .file, textContent: nil)
    }

    private static func downscale(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let maxSide = max(image.size.width, image.size.height)
        guard maxSide > maxDimension else { return image }
        let scale = maxDimension / maxSide
        let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}
