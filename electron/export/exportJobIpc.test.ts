import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NomiRenderManifestV1 } from "./exportManifest";

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) => path.join(os.tmpdir(), "nomi-electron-mock", name),
    getAppPath: () => process.cwd(),
  },
}));

let tempRoot = "";

function makeManifest(projectId = "project-1"): NomiRenderManifestV1 {
  return {
    version: 1,
    projectId,
    createdAt: "2026-05-24T00:00:00.000Z",
    timeline: {
      fps: 30,
      durationFrames: 30,
      range: { startFrame: 0, endFrame: 30 },
      tracks: [{ id: "track-1", kind: "video", clips: [] }],
    },
    profile: {
      preset: "publish",
      container: "mp4",
      videoCodec: "h264",
      audioCodec: "aac",
      width: 1920,
      height: 1080,
      fps: 30,
      pixelFormat: "yuv420p",
      quality: "standard",
    },
    assets: {},
  };
}

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nomi-export-job-ipc-test-"));
  process.env.NOMI_PROJECTS_DIR = tempRoot;
});

afterEach(() => {
  delete process.env.NOMI_PROJECTS_DIR;
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("runtime export job IPC functions", () => {
  it("starts a job by resolving projectId to projectDir and returns jobId", async () => {
    const { cancelExportJob, createProject, getExportJobStatus, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });

    const result = startExportJob({ projectId: "project-1", manifest: makeManifest("project-1"), outputName: "demo" });
    const snapshot = getExportJobStatus(result.jobId);

    expect(result.jobId).toBe(snapshot.id);
    expect(snapshot).toMatchObject({
      projectId: "project-1",
      projectDir: path.join(tempRoot, "Project One"),
      outputName: "demo",
      status: "queued",
    });
    await cancelExportJob(result.jobId);
  });

  it("returns status and can cancel a job", async () => {
    const { cancelExportJob, createProject, getExportJobStatus, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });
    const { jobId } = startExportJob({ projectId: "project-1", manifest: makeManifest("project-1") });

    expect(getExportJobStatus(jobId).status).toBe("queued");

    const result = await cancelExportJob(jobId);
    const cancelled = getExportJobStatus(jobId);

    expect(result).toEqual({ ok: true });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelled).toBe(true);
  });

  it("rejects missing and unknown projectId before creating a job", async () => {
    const { createProject, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });

    expect(() => startExportJob({ manifest: makeManifest("project-1") })).toThrow(/projectId is required/i);
    expect(() => startExportJob({ projectId: "missing", manifest: makeManifest("missing") })).toThrow(/Project not found/i);
  });

  it("rejects unresolved renderer manifest requests with a clear asset resolution error", async () => {
    const { createProject, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });

    expect(() =>
      startExportJob({
        projectId: "project-1",
        manifest: {
          ...makeManifest("project-1"),
          assets: {
            asset1: { id: "asset1", kind: "video", url: "nomi-local://project-1/assets/video.webm" },
          },
        },
      }),
    ).toThrow(/asset resolution is not wired yet/i);
  });

  it("rejects renderer URL assets even when a fake absolutePath is supplied", async () => {
    const { createProject, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });

    expect(() =>
      startExportJob({
        projectId: "project-1",
        manifest: {
          ...makeManifest("project-1"),
          assets: {
            asset1: {
              id: "asset1",
              kind: "video",
              url: "nomi-local://project-1/assets/video.webm",
              absolutePath: path.join(tempRoot, "fake-renderer-path.webm"),
            },
          },
        },
      }),
    ).toThrow(/asset resolution is not wired yet/i);
  });

  it("rejects renderer-supplied absolutePath assets without a URL", async () => {
    const { createProject, startExportJob } = await import("../runtime");
    createProject({ id: "project-1", name: "Project One", version: 1 });

    expect(() =>
      startExportJob({
        projectId: "project-1",
        manifest: {
          ...makeManifest("project-1"),
          assets: {
            asset1: {
              id: "asset1",
              kind: "video",
              absolutePath: path.join(tempRoot, "renderer-supplied.webm"),
            },
          },
        },
      }),
    ).toThrow(/asset resolution is not wired yet/i);
  });
});
