import { describe, expect, it } from "vitest";
import type { ExportProfile } from "./exportTypes";
import { buildWebmToMp4Args } from "./ffmpegCommandBuilder";

const standardProfile: ExportProfile = {
  preset: "publish",
  container: "mp4",
  videoCodec: "h264",
  audioCodec: "none",
  width: 1920,
  height: 1080,
  fps: 30,
  pixelFormat: "yuv420p",
  quality: "standard",
};

function build(overrides: Partial<ExportProfile> = {}, noAudio = false): string[] {
  return buildWebmToMp4Args({
    inputPath: "/tmp/input.webm",
    outputPath: "/tmp/output.partial.mp4",
    profile: { ...standardProfile, ...overrides },
    noAudio,
  });
}

describe("buildWebmToMp4Args", () => {
  it("includes expected standard MP4 transcode args with input and partial output paths", () => {
    expect(build()).toEqual([
      "-y",
      "-i", "/tmp/input.webm",
      "-an",
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-r", "30",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-movflags", "+faststart",
      "/tmp/output.partial.mp4",
    ]);
  });

  it("emits -an when audioCodec is none or noAudio is true", () => {
    expect(build({ audioCodec: "none" })).toContain("-an");
    expect(build({ audioCodec: "aac" }, true)).toContain("-an");
  });

  it("does not emit -an when profile audioCodec is aac and noAudio is false", () => {
    expect(build({ audioCodec: "aac" }, false)).not.toContain("-an");
  });

  it("uses profile width, height, fps, and pixelFormat instead of legacy defaults", () => {
    const args = build({ width: 720, height: 900, fps: 24, pixelFormat: "yuv420p" });

    expect(args).toContain("scale=720:900:force_original_aspect_ratio=decrease,pad=720:900:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p");
    expect(args.slice(args.indexOf("-r"), args.indexOf("-r") + 2)).toEqual(["-r", "24"]);
  });

  it("changes CRF by quality", () => {
    expect(build({ quality: "small" }).slice(-5, -3)).toEqual(["-crf", "28"]);
    expect(build({ quality: "standard" }).slice(-5, -3)).toEqual(["-crf", "23"]);
    expect(build({ quality: "high" }).slice(-5, -3)).toEqual(["-crf", "18"]);
  });
});
