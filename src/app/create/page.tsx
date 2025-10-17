
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { generatePoem } from "@/ai/flows/generate-poem";
import { adjustPoemStyle } from "@/ai/flows/adjust-poem-style";
import {
  Upload,
  Copy,
  Sparkles,
  PenLine,
  Camera,
  Heart,
  BookOpen,
  Moon,
  Sun,
  Wand2,
  CheckCircle,
  Info,
  Share2,
  Download,
  Star,
  Zap,
} from "lucide-react";

const samplePoem = `Where light and shadow softly correspond,
A silent chair, a window just beyond.
The world outside, a muted, hazy view,
Awaiting thoughts, both old and freshly new.

A stark design, in simple, graceful lines,
Where quiet contemplation intertwines.
This empty stage, for stories to unfold,
In whispers of the future, brave and bold.`;

export default function CreatePage() {
  const [imagePreview, setImagePreview] = useState<string>(
    "https://placehold.co/600x400.png"
  );
  const [poem, setPoem] = useState<string>(samplePoem);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [style, setStyle] = useState<string>("free verse");
  const [isSample, setIsSample] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [poemHistory, setPoemHistory] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 100);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      generateNewPoem(dataUri, style);
      setIsSample(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const generateNewPoem = async (photoDataUri: string, poemStyle: string) => {
    setIsLoading(true);
    setPoem("");
    try {
      const result = await generatePoem({ photoDataUri, poemStyle });
      setPoem(result.poem);
      setPoemHistory((prev) => [result.poem, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Poem Generation Failed",
        description:
          "Could not generate a poem. Please try another image or check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleStyleChange = async (newStyle: string) => {
    setStyle(newStyle);
    if (isSample || !poem) return;
    setIsAdjusting(true);
    try {
      const result = await adjustPoemStyle({ poem, style: newStyle });
      setPoem(result.adjustedPoem);
    } catch (error) {
      console.error(error);
      toast({
        title: "Style Adjustment Failed",
        description: "Could not adjust the poem style. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const copyToClipboard = () => {
    if (!poem) return;
    navigator.clipboard.writeText(poem);
    toast({ title: "Copied to Clipboard!", description: "Poem copied." });
  };

  const downloadPoem = () => {
    if (!poem) return;
    const blob = new Blob([poem], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-poem.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/20 relative overflow-hidden">
      <main className="relative z-10 min-h-screen text-foreground font-body">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <header className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Link>
            <div className="mt-4 inline-flex items-center gap-4 p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <PenLine className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-headline gradient-text">Create a Poem</h1>
            </div>
            <p className="mt-3 text-muted-foreground">Upload an image and let AI craft a poem for you.</p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-7xl mx-auto">
            {/* Upload */}
            <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  Your Inspiration
                </CardTitle>
                <CardDescription>Drag & drop or click to upload</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative aspect-video w-full rounded-xl overflow-hidden border-2 transition-all ${
                    isDragging ? "border-purple-500 scale-105" : "border-purple-200/50 dark:border-purple-700/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview && (
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  )}
                  {!imagePreview || imagePreview === "https://placehold.co/600x400.png" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <Upload className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Drop your image here or click to browse</p>
                      </div>
                    </div>
                  ) : null}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-200 dark:bg-purple-700">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full btn-gradient">
                  <Upload className="mr-2 h-4 w-4" /> Choose Image
                </Button>
              </CardFooter>
            </Card>

            {/* Poem */}
            <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Poem</span>
                  <Sparkles className="h-6 w-6 text-primary" />
                </CardTitle>
                <CardDescription>Your AI-crafted verses</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[260px] relative">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/6" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{poem}</p>
                )}
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-auto flex-grow">
                  <Select onValueChange={handleStyleChange} value={style} disabled={isLoading || isAdjusting || isSample}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free verse">Free Verse</SelectItem>
                      <SelectItem value="haiku">Haiku</SelectItem>
                      <SelectItem value="sonnet">Sonnet</SelectItem>
                      <SelectItem value="limerick">Limerick</SelectItem>
                      <SelectItem value="elegy">Elegy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={copyToClipboard} variant="outline" className="w-full sm:w-auto" disabled={!poem || isLoading || isAdjusting}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button onClick={downloadPoem} variant="outline" className="w-full sm:w-auto" disabled={!poem || isLoading || isAdjusting}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </CardFooter>
            </Card>
          </div>

          {poemHistory.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-headline text-center mb-6 gradient-text">Recent Creations</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {poemHistory.slice(0, 3).map((p, i) => (
                  <Card key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Previous Creation</span>
                      </div>
                      <p className="text-sm text-foreground/80 italic line-clamp-6">{p}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


