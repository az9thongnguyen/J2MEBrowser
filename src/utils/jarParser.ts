/**
 * JAR Parser Utility
 * Parses JAR/JAD files to extract MIDlet information
 */

import JSZip from "jszip";

export interface MIDletInfo {
    name: string;
    icon: string | null;
    className: string;
}

export interface JARManifest {
    midletName: string;
    midletVersion: string;
    midletVendor: string;
    midlets: MIDletInfo[];
    screenWidth: number;
    screenHeight: number;
    className: string;
    rawManifest: Record<string, string>;
}

/**
 * Parse a MANIFEST.MF file content into key-value pairs
 */
function parseManifest(content: string): Record<string, string> {
    const manifest: Record<string, string> = {};
    let currentKey = "";
    let currentValue = "";

    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        if (line.startsWith(" ")) {
            // Continuation of previous value
            currentValue += line.substring(1);
        } else if (line.includes(":")) {
            // Save previous entry
            if (currentKey) {
                manifest[currentKey] = currentValue.trim();
            }

            const colonIndex = line.indexOf(":");
            currentKey = line.substring(0, colonIndex).trim();
            currentValue = line.substring(colonIndex + 1);
        }
    }

    // Save last entry
    if (currentKey) {
        manifest[currentKey] = currentValue.trim();
    }

    return manifest;
}

/**
 * Parse MIDlet entries from manifest
 * Format: "name, icon, class"
 */
function parseMIDletEntries(manifest: Record<string, string>): MIDletInfo[] {
    const midlets: MIDletInfo[] = [];
    let i = 1;

    while (manifest[`MIDlet-${i}`]) {
        const entry = manifest[`MIDlet-${i}`];
        const parts = entry.split(",").map((s) => s.trim());

        midlets.push({
            name: parts[0] || `MIDlet ${i}`,
            icon: parts[1] || null,
            className: parts[2] || "",
        });

        i++;
    }

    return midlets;
}

/**
 * Parse screen size from manifest
 */
function parseScreenSize(manifest: Record<string, string>): {
    width: number;
    height: number;
} {
    // Common screen sizes for J2ME devices
    const defaultWidth = 240;
    const defaultHeight = 320;

    const widthStr =
        manifest["MIDlet-Screen-Width"] ||
        manifest["Nokia-MIDlet-Canvas-Size"]?.split("x")[0];
    const heightStr =
        manifest["MIDlet-Screen-Height"] ||
        manifest["Nokia-MIDlet-Canvas-Size"]?.split("x")[1];

    return {
        width: widthStr ? parseInt(widthStr, 10) : defaultWidth,
        height: heightStr ? parseInt(heightStr, 10) : defaultHeight,
    };
}

/**
 * Parse a JAR file and extract MIDlet information
 */
export async function parseJAR(file: File): Promise<JARManifest> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    // Find and read MANIFEST.MF
    const manifestFile = contents.file("META-INF/MANIFEST.MF");

    if (!manifestFile) {
        throw new Error("Invalid JAR: MANIFEST.MF not found");
    }

    const manifestContent = await manifestFile.async("string");
    const rawManifest = parseManifest(manifestContent);

    const midlets = parseMIDletEntries(rawManifest);
    const { width, height } = parseScreenSize(rawManifest);

    return {
        midletName: rawManifest["MIDlet-Name"] || file.name.replace(".jar", ""),
        midletVersion: rawManifest["MIDlet-Version"] || "1.0",
        midletVendor: rawManifest["MIDlet-Vendor"] || "Unknown",
        midlets,
        screenWidth: width,
        screenHeight: height,
        className: midlets[0]?.className || "Start",
        rawManifest,
    };
}

/**
 * Parse a JAD file content
 */
export function parseJAD(content: string): JARManifest {
    const rawManifest = parseManifest(content);
    const midlets = parseMIDletEntries(rawManifest);
    const { width, height } = parseScreenSize(rawManifest);

    return {
        midletName: rawManifest["MIDlet-Name"] || "Unknown",
        midletVersion: rawManifest["MIDlet-Version"] || "1.0",
        midletVendor: rawManifest["MIDlet-Vendor"] || "Unknown",
        midlets,
        screenWidth: width,
        screenHeight: height,
        className: midlets[0]?.className || "Start",
        rawManifest,
    };
}

/**
 * Extract icon from JAR file
 */
export async function extractIcon(
    file: File,
    iconPath: string
): Promise<string | null> {
    try {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);

        const iconFile = contents.file(iconPath.replace(/^\//, ""));
        if (!iconFile) return null;

        const iconData = await iconFile.async("base64");
        const ext = iconPath.split(".").pop()?.toLowerCase() || "png";
        const mimeType = ext === "gif" ? "image/gif" : "image/png";

        return `data:${mimeType};base64,${iconData}`;
    } catch {
        return null;
    }
}
