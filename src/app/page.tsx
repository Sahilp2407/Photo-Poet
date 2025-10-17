"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import Image from "next/image";
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
  X, 
  CheckCircle, 
  Info, 
  Play, 
  Pause,
  Volume2,
  Share2,
  Download,
  Star,
  Zap
} from "lucide-react";

const samplePoem = `Where light and shadow softly correspond,
A silent chair, a window just beyond.
The world outside, a muted, hazy view,
Awaiting thoughts, both old and freshly new.

A stark design, in simple, graceful lines,
Where quiet contemplation intertwines.
This empty stage, for stories to unfold,
In whispers of the future, brave and bold.`;

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string>(
    "https://placehold.co/600x400.png"
  );
  const [poem, setPoem] = useState<string>(samplePoem);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [style, setStyle] = useState<string>("free verse");
  const [isSample, setIsSample] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [poemHistory, setPoemHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Welcome to Photo Poet!",
      description: "Transform your photos into beautiful poetry with AI magic.",
      icon: <Sparkles className="h-6 w-6" />
    },
    {
      title: "Upload Your Photo",
      description: "Drag and drop or click to upload any image that inspires you.",
      icon: <Camera className="h-6 w-6" />
    },
    {
      title: "Choose Your Style",
      description: "Select from various poetry styles like Haiku, Sonnet, or Free Verse.",
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      title: "Enjoy Your Poem",
      description: "Copy, share, or regenerate your unique poetic creation.",
      icon: <Heart className="h-6 w-6" />
    }
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

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
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      generateNewPoem(dataUri, style);
      setIsSample(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const generateNewPoem = async (photoDataUri: string, poemStyle: string) => {
    setIsLoading(true);
    setPoem("");
    try {
      const result = await generatePoem({ photoDataUri, poemStyle });
      setPoem(result.poem);
      setPoemHistory(prev => [result.poem, ...prev.slice(0, 4)]); // Keep last 5 poems
    } catch (error) {
      console.error(error);
      toast({
        title: "Poem Generation Failed",
        description: "Could not generate a poem. Please try another image or check your connection.",
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
      toast({
        title: "Style Updated!",
        description: `Your poem has been transformed into ${newStyle} style.`,
      });
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
    toast({
      title: "Copied to Clipboard!",
      description: "Your poem is ready to share with the world.",
    });
  };

  const sharePoem = async () => {
    if (!poem) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI-Generated Poem",
          text: poem,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const downloadPoem = () => {
    if (!poem) return;
    
    const blob = new Blob([poem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-poem.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Poem Downloaded!",
      description: "Your poem has been saved to your device.",
    });
  };

  const regeneratePoem = () => {
    if (imagePreview && imagePreview !== "https://placehold.co/600x400.png") {
      generateNewPoem(imagePreview, style);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/20 relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs with different sizes and speeds */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-200/20 to-purple-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* Additional smaller floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-green-200/20 to-teal-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.3) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                {tutorialSteps[currentStep].icon}
              </div>
              <h3 className="text-2xl font-headline mb-4 gradient-text">
                {tutorialSteps[currentStep].title}
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {tutorialSteps[currentStep].description}
              </p>
              
              <div className="flex justify-center gap-2 mb-6">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-purple-500 w-6' 
                        : 'bg-purple-200 dark:bg-purple-700'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < tutorialSteps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-1 btn-gradient"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowTutorial(false)}
                    className="flex-1 btn-gradient"
                  >
                    Get Started!
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Image uploaded successfully!</span>
          </div>
        </div>
      )}

      {/* Dark mode toggle */}
      <div className="fixed top-6 right-6 z-40">
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-purple-500" />
          )}
        </Button>
      </div>

      <main className="relative z-10 min-h-screen text-foreground font-body">
      <div className="container mx-auto px-4 py-8 md:py-16">
          {/* Enhanced Header */}
          <header className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6 p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 animate-in fade-in duration-1000">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg animate-glow">
                <PenLine className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-6xl md:text-7xl font-headline gradient-text">
              Photo Poet
            </h1>
          </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-300">
              Transform your memories into timeless verses. Upload a photo and watch as AI weaves its essence into a unique poetic masterpiece.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-200/50 dark:border-purple-700/50">
                <Camera className="h-4 w-4 text-purple-500" />
                <span>Drag & Drop Upload</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-200/50 dark:border-purple-700/50">
                <Zap className="h-4 w-4 text-pink-500" />
                <span>Instant AI Generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-200/50 dark:border-purple-700/50">
                <Share2 className="h-4 w-4 text-purple-500" />
                <span>Easy Sharing</span>
              </div>
            </div>
        </header>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-7xl mx-auto">
            {/* Enhanced Image Upload Card */}
            <Card className="w-full animate-in fade-in duration-700 slide-in-from-left-8 shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden group hover:shadow-3xl transition-all duration-500 card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
              
              <CardHeader className="relative z-10 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg relative overflow-hidden">
                    <Camera className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                  <div>
                    <span className="gradient-text">Your Inspiration</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">Ready to create</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Drag and drop or click to upload a photo that speaks to your soul. We'll transform it into beautiful poetry.
              </CardDescription>
                
                {/* File type indicators */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>JPEG, PNG</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>GIF, WebP</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>Max 10MB</span>
                  </div>
                </div>
            </CardHeader>
              
              <CardContent className="relative z-10">
                <div 
                  className={`relative aspect-video w-full rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                    isDragging 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 scale-105 shadow-2xl' 
                      : 'border-purple-200/50 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-600'
                  } shadow-lg group-hover:shadow-xl`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview && imagePreview !== "https://placehold.co/600x400.png" ? (
                    <>
                  <Image
                    src={imagePreview}
                    alt="Image for poem generation"
                    fill
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                    data-ai-hint="dramatic landscape"
                  />
                      
                      {/* Image overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-green-500 rounded-full">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">Image uploaded</span>
                              </div>
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                              >
                                Change
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Upload overlay with enhanced design */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20">
                        <div className="text-center p-8">
                          {/* Animated upload icon */}
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto relative overflow-hidden">
                              <Upload className="h-10 w-10 text-white relative z-10" />
                              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                            {/* Floating particles */}
                            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                              Drop your image here
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              or click to browse files
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                              <span>📷 Photos</span>
                              <span>🎨 Artwork</span>
                              <span>🌅 Landscapes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Drag overlay with enhanced animation */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-8">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                          <Upload className="h-12 w-12 text-white animate-bounce" />
                        </div>
                        <p className="text-2xl font-bold mb-2">Drop to upload</p>
                        <p className="text-white/80">Release to add your image</p>
                      </div>
                    </div>
                  )}

                  {/* Progress bar with enhanced styling */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-purple-200/50 dark:bg-purple-700/50 backdrop-blur-sm">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 relative overflow-hidden"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                      </div>
                    </div>
                )}
              </div>
                
                {/* Upload tips */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500 rounded-lg mt-0.5">
                      <Info className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                        Pro Tips for Better Poems
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• High contrast images work best</li>
                        <li>• Include interesting subjects or landscapes</li>
                        <li>• Avoid blurry or low-quality photos</li>
                      </ul>
                    </div>
                  </div>
                </div>
            </CardContent>
              
              <CardFooter className="relative z-10 pt-6 flex-col gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
                
                {/* Main upload button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                  className="w-full h-14 text-lg font-semibold btn-gradient relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="loading-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mr-3 h-5 w-5" />
                      Choose Your Image
                    </>
                  )}
                </Button>
                
                {/* Quick actions */}
                {!isSample && (
                  <div className="flex gap-3 w-full">
                    <Button
                      onClick={regeneratePoem}
                      variant="outline"
                      size="sm"
                      className="flex-1 btn-outline-enhanced h-10"
                disabled={isLoading}
              >
                      <Zap className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => setShowTutorial(true)}
                      variant="outline"
                      size="sm"
                      className="btn-outline-enhanced h-10 w-10 p-0"
                      title="Show tutorial"
                    >
                      <Info className="h-4 w-4" />
              </Button>
                  </div>
                )}
                
                {/* Upload status */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full text-center">
                    <p className="text-sm text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
            </CardFooter>
          </Card>

            {/* Enhanced Poem Display Card */}
            <Card className="w-full animate-in fade-in-50 duration-700 slide-in-from-right-8 shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden group hover:shadow-3xl transition-all duration-500 card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 pb-6">
                <CardTitle className="flex items-center justify-between text-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span>Poetic Creation</span>
                  </div>
                  <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
              </CardTitle>
                <CardDescription className="text-base">
                  A unique poetic interpretation born from your image's soul.
              </CardDescription>
            </CardHeader>
              <CardContent className="relative z-10 min-h-[300px]">
              {isLoading ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg animate-pulse">
                        <Wand2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-muted-foreground">Crafting your poem...</span>
                    </div>
                    <Skeleton className="h-6 w-full rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-5/6 rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-full rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-4/6 rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-full rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-3/4 rounded-lg skeleton-enhanced" />
                    <Skeleton className="h-6 w-5/6 rounded-lg skeleton-enhanced" />
                </div>
              ) : (
                <div
                    className={`transition-all duration-500 ${
                      isAdjusting ? "opacity-50 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  {isAdjusting && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="p-4 bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-lg backdrop-blur-sm">
                          <Sparkles className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    </div>
                  )}
                    <div className="prose prose-lg max-w-none">
                      <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90 font-body italic">
                    {poem}
                  </p>
                    </div>
                </div>
              )}
            </CardContent>
              <CardFooter className="relative z-10 flex-col gap-4 pt-6">
                <div className="w-full flex gap-2">
                  <div className="flex-grow">
                <Select
                  onValueChange={handleStyleChange}
                  value={style}
                  disabled={isLoading || isAdjusting || isSample}
                >
                      <SelectTrigger className="w-full h-12 text-base btn-outline-enhanced">
                        <SelectValue placeholder="Choose your style" />
                  </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-700/50">
                        <SelectItem value="free verse" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">Free Verse</SelectItem>
                        <SelectItem value="haiku" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">Haiku</SelectItem>
                        <SelectItem value="sonnet" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">Sonnet</SelectItem>
                        <SelectItem value="limerick" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">Limerick</SelectItem>
                        <SelectItem value="elegy" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">Elegy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 w-full">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                    className="flex-1 btn-outline-enhanced"
                disabled={!poem || isLoading || isAdjusting}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
                  <Button
                    onClick={sharePoem}
                    variant="outline"
                    className="btn-outline-enhanced"
                    disabled={!poem || isLoading || isAdjusting}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={downloadPoem}
                    variant="outline"
                    className="btn-outline-enhanced"
                    disabled={!poem || isLoading || isAdjusting}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
            </CardFooter>
          </Card>
        </div>

          {/* Poem History */}
          {poemHistory.length > 0 && (
            <div className="mt-16 animate-in fade-in duration-1000 delay-700">
              <h3 className="text-2xl font-headline text-center mb-8 gradient-text">Recent Creations</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {poemHistory.slice(0, 3).map((poem, index) => (
                  <Card key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Previous Creation</span>
                      </div>
                      <p className="text-sm text-foreground/80 font-body italic line-clamp-6">
                        {poem}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center mt-16 pt-8 border-t border-purple-200/50 dark:border-purple-700/50 animate-in fade-in duration-1000 delay-700">
            <p className="text-sm text-muted-foreground">
              Crafted with ❤️ using AI magic • Photo Poet
            </p>
          </footer>
      </div>
    </main>
    </div>
  );
}
