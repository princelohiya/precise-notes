"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import ReactMarkdown from "react-markdown";
import {
  UploadCloud,
  FileVideo,
  NotebookText,
  AudioLines,
  LoaderCircle,
  PackageCheck,
  ClipboardCopy,
  CheckCircle,
  Download,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState("Initializing core engine...");
  const [errorMessage, setErrorMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Progress states
  const [extractProgress, setExtractProgress] = useState(0);
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 });
  const [isCopied, setIsCopied] = useState(false);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        const baseURL =
          "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";

        ffmpeg.on("log", ({ message }) => {
          // System level logs - keeping them here for potential internal debugging,
          // but we rely on custom progress events for the UI.
          console.debug("[FFmpeg]:", message);
        });

        // Native track extraction progress
        ffmpeg.on("progress", ({ progress }) => {
          setExtractProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        setIsLoaded(true);
        setStatus("Core engine loaded. Ready to process lectures.");
      } catch (error) {
        console.error("FFmpeg failed to load:", error);
        setStatus("System error: Core engine failed to initialize.");
        setErrorMessage(
          "Network restriction or browser incompatibility preventing core download. Check network console.",
        );
      }
    };

    loadFFmpeg();
  }, []);

  const handleProcessVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLoaded || !ffmpegRef.current || isProcessing) return;

    // Clear previous state and show uploader spinner immediately
    setErrorMessage("");
    setNotes("");
    setExtractProgress(0);
    setChunkProgress({ current: 0, total: 0 });
    setIsProcessing(true);
    setStatus("Reading file and preparing workspace...");

    const ffmpeg = ffmpegRef.current;

    try {
      // Step 1: File Ingestion
      await ffmpeg.writeFile("input_video.mp4", await fetchFile(file));

      // Step 2: Audio Extraction & Chunking (Local CPU work)
      setStatus(
        `Extracting audio from ${file.name}... This may take a few minutes.`,
      );
      setExtractProgress(1); // Set initial non-zero to activate uploader spinner

      await ffmpeg.exec([
        "-i",
        "input_video.mp4",
        "-vn", // Disable video stream
        "-acodec",
        "libmp3lame", // Re-encode to MP3
        "-q:a",
        "2", // Higher quality (VBR)
        "-f",
        "segment", // Segment muxer
        "-segment_time",
        "600", // 10 minutes per chunk
        "chunk_%03d.mp3", // Output pattern
      ]);

      // Step 3: Identify generated chunks
      const dir = await ffmpeg.listDir(".");
      const chunkFiles = dir
        .filter((f) => f.name.startsWith("chunk_") && f.name.endsWith(".mp3"))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (chunkFiles.length === 0) {
        throw new Error("No audio chunks generated. Please check video file.");
      }

      // Step 4: AI Processing Loop
      setStatus("Beginning AI synthesis... Notes will generate live.");
      setChunkProgress({ current: 0, total: chunkFiles.length });

      for (let i = 0; i < chunkFiles.length; i++) {
        const chunk = chunkFiles[i];
        setChunkProgress({ current: i + 1, total: chunkFiles.length });
        setStatus(
          `Analyzing lecture segment ${i + 1} of ${chunkFiles.length}...`,
        );

        const fileData = await ffmpeg.readFile(chunk.name);
        const audioBlob = new Blob([fileData as any], { type: "audio/mp3" });

        const formData = new FormData();
        formData.append("audio", audioBlob, chunk.name);

        try {
          const response = await fetch("/api/generate-notes", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            // Handle rate limits explicitly
            if (response.status === 429) {
              throw new Error(
                "Rate limit hit. The chunks are processing too quickly.",
              );
            }
            throw new Error(`API Error on chunk ${i + 1}`);
          }

          const data = await response.json();
          setNotes((prev) => prev + "\n\n" + data.notes);
        } catch (error) {
          console.error(error);
          setStatus(
            `Failed to process lecture segment ${i + 1}. Attempting to proceed.`,
          );
        } finally {
          // 🧹 Memory Cleanup
          await ffmpeg.deleteFile(chunk.name);

          // ⏱️ ANTI-RATE-LIMIT COOLDOWN
          // Wait 8 seconds before sending the next chunk (skip delay on the final chunk)
          if (i < chunkFiles.length - 1) {
            setStatus("Cooling down API to prevent rate limits... (8s)");
            await new Promise((resolve) => setTimeout(resolve, 8000));
          }
        }
      }

      setStatus("Lecture synthesis complete.");
    } catch (error: any) {
      console.error(error);
      setStatus("Synthesis failed.");
      setErrorMessage(
        error.message || "An unexpected error occurred during processing.",
      );
    } finally {
      setIsProcessing(false);
      // Ensure massive original file is deleted, regardless of success/failure
      if (ffmpegRef.current) {
        try {
          await ffmpegRef.current.deleteFile("input_video.mp4");
        } catch (e) {}
      }
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(notes);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setNotes("");
    setExtractProgress(0);
    setChunkProgress({ current: 0, total: 0 });
    setStatus("Ready to process another lecture.");
    setErrorMessage("");
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 sm:p-10 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Main Header / Brand */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-800 pb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-inner mb-15 sm:mb-0">
              {/* <NotebookText className="w-9 h-9 text-sky-500 " /> */}
              <img className="border-0 rounded-sm" src="./favicon.ico" alt="" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Precise Notes
              </h1>
              <p className="text-lg text-neutral-400 mt-1">
                Intelligent synthesis of offline video lectures, completely
                in-browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 px-4 bg-neutral-900 border border-neutral-800 rounded-full shadow-inner">
            {isLoaded ? (
              <>
                <PackageCheck className="w-5 h-5 text-lime-500" />
                <span className="text-sm font-medium text-lime-500">
                  System Ready
                </span>
              </>
            ) : (
              <>
                <LoaderCircle className="w-5 h-5 text-neutral-600 animate-spin" />
                <span className="text-sm font-medium text-neutral-500">
                  Core Engine Loading...
                </span>
              </>
            )}
          </div>
        </header>

        {/* Dynamic Status / Progress Monitor */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <LoaderCircle
                className={`w-7 h-7 text-sky-500 ${isProcessing && "animate-spin"}`}
              />
              Status Monitor
            </h2>
            <p className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              Active:{" "}
              <span className="text-neutral-100">
                {isProcessing ? "Processing (WASM)" : "Awaiting Input"}
              </span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-neutral-950/40 border border-neutral-800/70 rounded-2xl font-mono text-sm shadow-inner break-words text-neutral-200">
              {status}
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-5 bg-red-950/30 border border-red-800/70 rounded-2xl text-sm shadow-inner text-red-200 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-white block mb-1">
                    Processing Error
                  </strong>
                  <p className="text-red-200/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* In-Browser Progress Bars (Blue for Extract, Green for AI) */}
            {extractProgress > 0 && chunkProgress.total === 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Audio Extraction Progress
                </label>
                <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden shadow-inner border border-neutral-700">
                  <div
                    className="bg-sky-600 h-3 rounded-full transition-all duration-300 shadow-md"
                    style={{ width: `${extractProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {chunkProgress.total > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  AI Segment Analysis
                </label>
                <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden shadow-inner border border-neutral-700 relative">
                  <div
                    className="bg-lime-600 h-3 rounded-full transition-all duration-500 shadow-md"
                    style={{
                      width: `${(chunkProgress.current / chunkProgress.total) * 100}%`,
                    }}
                  ></div>
                  <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-black mix-blend-difference">
                    {chunkProgress.current} / {chunkProgress.total} Segments
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Generated Notes Section (Visible when notes exist) */}
        {notes && (
          <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-neutral-800 pb-8 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-inner">
                  <NotebookText className="w-8 h-8 text-lime-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Generated Lecture Notes
                  </h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    Professional synthesis of your lecture video
                  </p>
                </div>
              </div>

              {/* Utility / Action Buttons */}
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                <button
                  onClick={copyToClipboard}
                  disabled={isCopied}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-800 text-neutral-100 text-sm font-medium rounded-xl hover:bg-neutral-700/80 transition-colors disabled:bg-neutral-800 disabled:text-neutral-500 border border-neutral-700 shadow-sm grow md:grow-0 justify-center"
                >
                  {isCopied ? (
                    <CheckCircle className="w-5 h-5 text-lime-500" />
                  ) : (
                    <ClipboardCopy className="w-5 h-5 text-sky-500" />
                  )}
                  {isCopied ? "Notes Copied" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([notes], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "lecture-notes.md";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-800 text-neutral-100 text-sm font-medium rounded-xl hover:bg-neutral-700/80 transition-colors border border-neutral-700 shadow-sm grow md:grow-0 justify-center"
                >
                  <Download className="w-5 h-5 text-lime-500" />
                  Download .md
                </button>
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors disabled:bg-neutral-600 disabled:text-neutral-400 shadow-lg grow md:grow-0 justify-center"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Process New Video
                </button>
              </div>
            </div>

            {/* The Magic Typography Container (prose-invert for Dark Theme) */}
            <div
              className="prose prose-invert prose-slate max-w-none 
                            prose-headings:text-white prose-headings:font-semibold 
                            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl 
                            prose-a:text-sky-400 prose-a:font-medium hover:prose-a:text-sky-300
                            prose-p:text-neutral-300 prose-p:leading-relaxed
                            prose-li:text-neutral-300
                            prose-strong:text-neutral-100
                            prose-pre:bg-neutral-950 prose-pre:text-neutral-100 prose-pre:shadow-sm prose-pre:rounded-xl prose-pre:border prose-pre:border-neutral-800
                            prose-code:text-sky-300 prose-code:bg-neutral-950 prose-code:p-1 prose-code:px-1.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:border prose-code:border-neutral-800"
            >
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Modern File Uploader / Workspace (Hides when processing complete or notes exist) */}
        {!notes && (
          <section
            className={`bg-neutral-900 border-2 ${errorMessage ? "border-red-800" : "border-neutral-800"} rounded-3xl shadow-xl transition-all duration-300`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center p-16 py-20 gap-6 text-center">
                <LoaderCircle className="w-16 h-16 text-sky-500 animate-spin" />
                <div>
                  <p className="font-semibold text-lg text-neutral-100">
                    Workspace is Active
                  </p>
                  <p className="text-neutral-400 mt-1 max-w-md">
                    FFmpeg is utilizing your device CPU to extract audio chunks.
                    Please remain on this tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-700 hover:border-sky-700 rounded-3xl m-3 transition-colors">
                <div className="flex flex-col items-center justify-center p-12 py-16 text-center">
                  <div className="relative mb-6 flex items-center justify-center">
                    <UploadCloud className="w-20 h-20 text-neutral-700" />
                    <FileVideo className="w-9 h-9 text-sky-500 absolute bg-neutral-900 p-1 rounded-full border border-neutral-800 -bottom-1.5 -right-1.5" />
                  </div>
                  <h3 className="font-bold text-xl text-white tracking-tight">
                    Upload Lecture Video
                  </h3>
                  <p className="text-base text-neutral-400 mt-2 mb-8 max-w-sm">
                    Drop your massive local video files here. Processing occurs
                    entirely within your browser for absolute privacy.
                  </p>

                  <div className="flex flex-col items-center">
                    <input
                      type="file"
                      accept="video/*"
                      ref={fileInputRef}
                      onChange={handleProcessVideo}
                      disabled={!isLoaded || isProcessing}
                      className="block w-full max-w-sm text-sm text-neutral-400 
                                      file:mr-5 file:py-3 file:px-6 file:rounded-full file:border-0 
                                      file:text-sm file:font-bold file:tracking-tight
                                      file:bg-sky-600 file:text-white 
                                      hover:file:bg-sky-500 disabled:file:bg-neutral-700 disabled:file:text-neutral-500
                                      cursor-pointer disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-neutral-600 mt-4 font-mono">
                      Supports: .mp4, .mkv, .mov, .avi
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
