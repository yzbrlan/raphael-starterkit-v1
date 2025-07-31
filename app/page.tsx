"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

import NameGeneratorForm from "@/components/product/generator/name-generator-form";
import NamesGrid from "@/components/product/results/names-grid";
import ChineseNamePricing from "@/components/product/pricing/chinese-name-pricing";
import PopularNames from "@/components/product/popular/popular-names";

interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

interface FormData {
  englishName: string;
  gender: 'male' | 'female' | 'other';
  birthYear?: string;
  personalityTraits?: string;
  namePreferences?: string;
  planType: '1' | '4';
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  
  const [generatedNames, setGeneratedNames] = useState<NameData[]>([]);
  
  // Current batch state
  const [currentBatch, setCurrentBatch] = useState<any | null>(null);
  const [currentGenerationRound, setCurrentGenerationRound] = useState(1);
  const [totalGenerationRounds, setTotalGenerationRounds] = useState(1);
  
  // History browsing state (for different batches)
  const [isInHistoryMode, setIsInHistoryMode] = useState(false);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);
  const [hasTriedFree, setHasTriedFree] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Check localStorage for previous free trial usage
  useEffect(() => {
    if (!loading) {
      if (!user) {
        const hasUsedFree = localStorage.getItem('hasTriedFreeGeneration') === 'true';
        setHasTriedFree(hasUsedFree);
      } else {
        // Clear localStorage flag for authenticated users
        localStorage.removeItem('hasTriedFreeGeneration');
        setHasTriedFree(false);
      }
    }
  }, [user, loading]);


  const handleGenerate = async (formData: FormData, forceNewBatch = false) => {
    // Check if it's a free trial attempt
    if (!user && hasTriedFree) {
      toast({
        title: "Free trial used",
        description: "You've already used your free generation. Please sign in for unlimited access!",
      });
      router.push('/sign-in');
      return;
    }

    setIsGenerating(true);
    
    // Determine if we need a new batch
    const needsNewBatch = forceNewBatch || 
                         isInHistoryMode || 
                         !currentBatch || 
                         compareFormParameters(formData, currentFormData);
    
    // If creating new batch, update form data and exit history mode
    if (needsNewBatch) {
      setCurrentFormData(formData);
      setIsInHistoryMode(false);
    }

    try {
      const requestBody = {
        ...formData,
        continueBatch: !needsNewBatch,
        batchId: !needsNewBatch ? currentBatch?.id : undefined
      };

      const response = await fetch('/api/chinese-names/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429 && data.rateLimited) {
          toast({
            title: "Daily limit reached",
            description: data.error || "You can generate 3 free names per day. Please sign in for unlimited access!",
          });
          // Show sign-in option
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
          return;
        }
        throw new Error(data.error || 'Failed to generate names');
      }

      // Set current generated names and show results
      setGeneratedNames(data.names);
      setShowResults(true);
      
      // Update batch and round information
      if (data.batch) {
        setCurrentBatch(data.batch);
        setCurrentGenerationRound(data.generationRound);
        
        // Calculate total rounds based on total names / 6 (names per round)
        // For new batches, total rounds equals current round
        // For continued batches, use the actual total from database
        const estimatedTotalRounds = data.isContinuation 
          ? Math.ceil(data.batch.totalNamesGenerated / 6)
          : data.generationRound; // For new batches, current round is the total
        
        console.log('Updating pagination state:', {
          isContinuation: data.isContinuation,
          currentRound: data.generationRound,
          totalNamesGenerated: data.batch.totalNamesGenerated,
          estimatedTotalRounds,
          oldTotalRounds: totalGenerationRounds
        });
        
        setTotalGenerationRounds(estimatedTotalRounds);
      }
      
      
      // Mark free trial as used for non-authenticated users
      if (!user) {
        setHasTriedFree(true);
        // Store in localStorage to persist across page refreshes
        localStorage.setItem('hasTriedFreeGeneration', 'true');
      }

      toast({
        title: data.message || "Names generated successfully!",
        description: `Generated ${data.names.length} unique Chinese names${data.creditsUsed ? ` using ${data.creditsUsed} credits` : ' for free'}`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      console.error('Detailed error:', errorMessage);
      toast({
        title: "Generation failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentFormData) return;
    // Always force new batch when regenerating from button
    await handleGenerate(currentFormData, true);
  };

  const handleContinueGeneration = async () => {
    if (!currentFormData || !currentBatch) return;
    // Continue in same batch - parameters haven't changed
    await handleGenerate(currentFormData, false);
  };

  const handleBackToForm = () => {
    setShowResults(false);
    setGeneratedNames([]);
    setCurrentFormData(null);
    setCurrentBatch(null);
    setCurrentGenerationRound(1);
    setTotalGenerationRounds(1);
    setIsInHistoryMode(false);
  };

  // Compare form parameters to determine if new batch is needed
  const compareFormParameters = (newForm: FormData, oldForm: FormData | null): boolean => {
    if (!oldForm) return true; // First generation always creates new batch
    
    return (
      newForm.englishName !== oldForm.englishName ||
      newForm.gender !== oldForm.gender ||
      newForm.birthYear !== oldForm.birthYear ||
      newForm.personalityTraits !== oldForm.personalityTraits ||
      newForm.namePreferences !== oldForm.namePreferences ||
      newForm.planType !== oldForm.planType
    );
  };


  // Handle batch-internal round navigation (within same batch)
  const handleRoundChange = async (roundIndex: number) => {
    if (!user || !currentBatch || roundIndex < 1 || roundIndex > totalGenerationRounds) return;
    
    setIsLoadingHistory(true);
    
    try {
      const response = await fetch(`/api/generation-batches/${currentBatch.id}?round=${roundIndex}`);
      if (response.ok) {
        const data = await response.json();
        setGeneratedNames(data.names);
        setCurrentGenerationRound(roundIndex);
        // Don't update totalGenerationRounds here - keep the current state
        // The total should only be updated when actually generating new names
        // setTotalGenerationRounds(data.pagination.totalRounds);
      }
    } catch (error) {
      console.error('Failed to load round:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const scrollToForm = () => {
    const formSection = document.querySelector('[data-name-generator-form]');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-muted/20 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-primary/10 text-primary mb-4">
                <span className="mr-2">🇨🇳</span>
                AI-Powered Chinese Name Generation
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Discover Your Perfect
                <br />
                <span className="text-primary">Chinese Name</span>
              </h1>
              
              <p className="mt-6 text-xl text-muted-foreground md:text-2xl max-w-3xl mx-auto">
                Create your authentic Chinese identity with our advanced AI that understands cultural significance, personal meaning, and traditional naming conventions.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  {loading ? 'Loading...' : !user ? (hasTriedFree ? '🔒 Sign In for More' : '🎁 Generate Free Name') : '🎯 Generate Name'}
                </button>
                <button
                  onClick={() => {
                    router.push('/product/random-generator');
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium border border-border text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Random Name Generator
                </button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {loading ? 'Loading...' : !user ? '3 free names daily' : 'Unlimited generation'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Instant generation
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Cultural accuracy
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            {!showResults ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Create Your Chinese Name
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Tell us about yourself and let our AI create a meaningful Chinese name that reflects your personality and cultural significance.
                  </p>
                </div>

                <div data-name-generator-form>
                  <NameGeneratorForm 
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    hasTriedFree={hasTriedFree}
                  />
                  
                  {/* Personal Center Button for authenticated users */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-center mt-6"
                    >
                      <button
                        onClick={() => router.push('/profile')}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary/20 hover:border-primary/40 rounded-lg"
                      >
                        👤 Profile - View History & Saved Names
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <NamesGrid
                names={generatedNames}
                onRegenerate={handleRegenerate}
                onBackToForm={handleBackToForm}
                isGenerating={isGenerating}
                // Batch-internal pagination props (for same batch, different rounds)
                currentPage={currentGenerationRound - 1} // Convert to 0-based index
                totalPages={totalGenerationRounds}
                onPageChange={(page) => handleRoundChange(page + 1)} // Convert back to 1-based
                isAuthenticated={!!user}
                isLoadingHistory={isLoadingHistory}
                // History browsing props  
                isHistoryView={isInHistoryMode}
                currentBatchInfo={currentBatch ? {
                  englishName: currentBatch.englishName,
                  gender: currentBatch.gender,
                  planType: currentBatch.planType,
                  createdAt: currentBatch.createdAt
                } : undefined}
                // New props for continue generation
                showContinueGeneration={!isInHistoryMode && !!currentBatch}
                onContinueGeneration={handleContinueGeneration}
              />
            )}
          </div>
        </div>
      </section>

      {/* Popular Names Section - Only show when not generating */}
      {!showResults && (
        <section className="py-20 bg-gradient-to-b from-background to-muted/20" data-popular-names>
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-6xl">
              <PopularNames onScrollToGenerator={scrollToForm} />
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Only show when not generating */}
      {!showResults && (
        <section className="py-20 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-6xl space-y-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Why Choose Our Chinese Name Generator?
                </h2>
                <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
                  Advanced AI technology combined with deep cultural understanding to create meaningful Chinese names that truly represent you.
                </p>
              </motion.div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="rounded-2xl bg-background p-8 shadow-sm border border-border"
                >
                  <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">AI-Powered Intelligence</h3>
                    <p className="text-muted-foreground">
                      Our advanced AI understands your personality traits, preferences, and cultural nuances to create names that truly represent you.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="rounded-2xl bg-background p-8 shadow-sm border border-border"
                >
                  <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl">🏮</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Cultural Authenticity</h3>
                    <p className="text-muted-foreground">
                      Each name is crafted with deep understanding of Chinese naming traditions, character meanings, and cultural significance.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="rounded-2xl bg-background p-8 shadow-sm border border-border"
                >
                  <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Instant Generation</h3>
                    <p className="text-muted-foreground">
                      Get your personalized Chinese name in seconds, complete with detailed meanings, pronunciation guides, and cultural context.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section - Only show when not generating */}
      {!showResults && (
        <ChineseNamePricing onScrollToForm={scrollToForm} />
      )}

      {/* Social Proof Section - Only show when not generating */}
      {!showResults && (
        <section className="py-20 bg-background">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-6xl space-y-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Loved by Thousands Worldwide
                </h2>
                <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
                  Join thousands of satisfied users who have discovered their perfect Chinese name with our AI-powered generator.
                </p>
              </motion.div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border p-8 shadow-sm bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "The name perfectly captures my personality. I love how it combines traditional meaning with my personal traits and cultural significance."
                    </p>
                    <div>
                      <h4 className="font-bold">Sarah Johnson</h4>
                      <p className="text-primary font-medium">
                        Chinese name: 李雨桐 (Lǐ Yǔtóng)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-2xl border p-8 shadow-sm bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "As someone studying Chinese culture, having an authentic Chinese name has been incredibly helpful for my cultural immersion and studies."
                    </p>
                    <div>
                      <h4 className="font-bold">Michael Chen</h4>
                      <p className="text-primary font-medium">
                        Chinese name: 陈铭哲 (Chén Míngzhé)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-2xl border p-8 shadow-sm bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "My Chinese colleagues were impressed by how meaningful and appropriate my AI-generated name is. It really reflects who I am!"
                    </p>
                    <div>
                      <h4 className="font-bold">Emily Davis</h4>
                      <p className="text-primary font-medium">
                        Chinese name: 戴美丽 (Dài Měilì)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section - Only show when not generating */}
      {!showResults && (
        <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="space-y-6"
              >
                <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  Start Your Cultural Journey Today
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                  Discover the perfect Chinese name that represents your identity, personality, and cultural connection.
                  <br />
                  Join thousands who have found their authentic Chinese identity.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <button 
                    onClick={scrollToForm}
                    className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                  >
                    {loading ? 'Loading...' : !user ? (hasTriedFree ? '🔒 Sign In for Unlimited Names' : '🎁 Get Your Free Chinese Name') : '🎯 Generate Chinese Name'}
                  </button>
                  <a 
                    href="#chinese-name-pricing"
                    className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Premium Features →
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
