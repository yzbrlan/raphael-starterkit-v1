"use client";

import { useState, Suspense, Component, ReactNode, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

const formSchema = z.object({
  gender: z.enum(["male", "female", "neutral"], {
    required_error: "Please select a gender preference.",
  }),
  style: z.enum([
    "nature-inspired",
    "achievement-focused", 
    "elegance-intellectual",
    "celestial-aspiration",
    "harmony-trustworthiness",
    "strength-resilience",
    "traditional"
  ], {
    required_error: "Please select a style preference.",
  }),
  count: z.enum(["6", "9", "10", "12"], {
    required_error: "Please select how many names to generate.",
  }),
  surnameInitial: z.string().optional(),
});

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

// Error Boundary Component
class NameCardErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Name card error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="h-full border-0 shadow-sm border-red-200 bg-red-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="text-red-600 mb-2">⚠️</div>
            <div className="text-sm text-red-700 font-medium mb-1">
              Failed to load name
            </div>
            <div className="text-xs text-red-600">
              Please try again
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Detailed Name Card Skeleton Component
function DetailedNameCardSkeleton() {
  return (
    <Card className="h-[300px] border-2 border-gray-100">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Chinese Name */}
        <div className="text-center mb-4">
          <Skeleton className="h-8 w-20 bg-violet-100 mx-auto mb-2" />
          <Skeleton className="h-5 w-32 bg-violet-50 mx-auto" />
        </div>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <Skeleton className="h-4 w-24 bg-gray-100 mb-2" />
          <div className="flex items-center justify-center gap-2 mb-3">
            <Skeleton className="h-6 w-16 bg-gray-100 rounded-full" />
            <Skeleton className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-full bg-gray-50" />
          <Skeleton className="h-4 w-3/4 bg-gray-50" />
          <Skeleton className="h-4 w-1/2 bg-gray-50" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-4">
          <Skeleton className="h-8 w-8 bg-gray-100 rounded" />
          <Skeleton className="h-8 w-8 bg-gray-100 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Grid Component
function LoadingNamesGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={`skeleton-${index}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <DetailedNameCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Detailed Name Card Component
const DetailedNameCard = memo(function DetailedNameCard({ 
  name, 
  isSelected, 
  isSaved = false,
  onSelect,
  onSave,
  gender,
  style
}: { 
  name: NameData;
  isSelected: boolean;
  isSaved?: boolean;
  onSelect: () => void;
  onSave?: () => void;
  gender: string;
  style: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name.chinese);
    toast({
      title: "Copied!",
      description: `${name.chinese} has been copied to clipboard`,
      duration: 2000,
    });
  }, [name.chinese, toast]);

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save names to your collection.",
        variant: "destructive",
      });
      return;
    }

    if (isSaved) {
      toast({
        title: "Already saved",
        description: "This name is already in your collection.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/saved-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chinese_name: name.chinese,
          pinyin: name.pinyin,
          meaning: name.meaning,
          cultural_notes: name.culturalNotes,
          personality_match: name.personalityMatch,
          characters: name.characters,
          generation_metadata: {
            style: name.style,
            saved_from: 'random_generator',
            saved_at: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        toast({
          title: "Name saved!",
          description: `${name.chinese} has been added to your collection.`,
        });
        onSave?.();
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: "Already saved",
            description: "This name is already in your collection.",
          });
        } else {
          throw new Error(errorData.error || 'Failed to save name');
        }
      }
    } catch (error) {
      console.error('Failed to save name:', error);
      toast({
        title: "Failed to save",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [name, user, isSaved, toast, onSave]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Added to favorites!",
      description: `${name.chinese} has been added to your favorites`,
      duration: 2000,
    });
  }, [name.chinese, toast]);

  // Split name into surname and given name
  const surname = name.characters[0]?.character || '';
  const givenName = name.characters.slice(1).map(c => c.character).join('') || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      }`}
      onClick={onSelect}
    >
      <Card className={`h-[300px] transition-all duration-300 ${
        isSelected 
          ? 'border-2 border-violet-500 bg-violet-50 shadow-lg' 
          : 'border-2 border-gray-100 hover:border-violet-200 hover:shadow-md'
      }`}>
        <CardContent className="p-6 h-full flex flex-col">
          {/* Chinese Name */}
          <div className="text-center mb-4">
            <div className="font-noto-serif text-2xl font-bold text-violet-700 mb-1">
              {name.chinese}
            </div>
            <div className="text-violet-500 font-medium">
              {name.pinyin}
            </div>
          </div>

          {/* Name Breakdown */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="text-sm text-gray-600 mb-2 text-center">
              {surname} + {givenName} [{gender === 'neutral' ? 'Neutral' : gender === 'male' ? 'Male' : 'Female'}]
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                {style === 'traditional' ? 'Traditional' : 
                 style === 'nature-inspired' ? 'Nature' :
                 style === 'achievement-focused' ? 'Achievement' :
                 style === 'elegance-intellectual' ? 'Elegant' :
                 style === 'celestial-aspiration' ? 'Celestial' :
                 style === 'harmony-trustworthiness' ? 'Harmony' :
                 style === 'strength-resilience' ? 'Strength' : style}
              </Badge>
            </div>
          </div>

          {/* Meaning */}
          <div className="flex-1 overflow-hidden">
            <div className="text-sm text-gray-700 mb-2 leading-relaxed">
              {name.meaning.length > 60 ? `${name.meaning.substring(0, 60)}...` : name.meaning}
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Beautiful meaning and bright future
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-gray-500 hover:text-violet-600"
              onClick={handleCopy}
              title="Copy name"
            >
              📋
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-2 h-8 w-8 ${
                isSaved 
                  ? 'text-amber-600 hover:text-amber-700' 
                  : 'text-gray-500 hover:text-amber-600'
              } ${isSaving ? 'opacity-50' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
              title={isSaved ? "Already saved" : "Save to collection"}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default function RandomNameGenerator() {
  const { toast } = useToast();
  const [generatedNames, setGeneratedNames] = useState<NameData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "neutral",
      style: "traditional",
      count: "10",
      surnameInitial: "",
    },
  });

  const styleOptions = [
    { value: "traditional", label: "Traditional", description: "Classic Chinese naming traditions" },
    { value: "nature-inspired", label: "Nature-Inspired", description: "Names connected to nature" },
    { value: "achievement-focused", label: "Achievement-Focused", description: "Ambitious and goal-oriented names" },
    { value: "elegance-intellectual", label: "Elegance & Intellectual", description: "Elegant and refined names" },
    { value: "celestial-aspiration", label: "Celestial & Aspiration", description: "Names reaching for the stars" },
    { value: "harmony-trustworthiness", label: "Harmony & Trust", description: "Harmonious and trustworthy names" },
    { value: "strength-resilience", label: "Strength & Resilience", description: "Strong and resilient names" },
  ];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setGeneratedNames([]);
    setSelectedName(null);

    try {
      // For now, generate mock names since we don't have the API
      const mockNames: NameData[] = [];
      const count = parseInt(values.count);
      
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        const mockName: NameData = {
          chinese: `张天${i + 1}`,
          pinyin: `Zhāng Tiān${i + 1}`,
          characters: [
            { character: "张", pinyin: "Zhāng", meaning: "Surname", explanation: "A traditional Chinese surname" },
            { character: "天", pinyin: "Tiān", meaning: "Sky", explanation: "Represents vastness and aspiration" },
            { character: `${i + 1}`, pinyin: "Number", meaning: "Order", explanation: "Sequential identifier" }
          ],
          meaning: `A ${values.style} name representing ${values.gender} characteristics`,
          culturalNotes: "Traditional Chinese naming conventions",
          personalityMatch: "Suits your chosen preferences",
          style: values.style
        };
        
        mockNames.push(mockName);
        setGeneratedNames([...mockNames]);
        
        toast({
          title: "New name generated!",
          description: `${mockName.chinese} (${mockName.style})`,
          duration: 2000,
        });
      }
      
      setIsGenerating(false);
      toast({
        title: "Generation complete!",
        description: `All ${count} names have been generated.`,
      });
    } catch (error) {
      console.error('Error generating names:', error);
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate names. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleSelectName = useCallback((chinese: string) => {
    setSelectedName(chinese);
    toast({
      title: "Name selected!",
      description: `You selected ${chinese} as your Chinese name`,
    });
  }, [toast]);

  const handleSaveName = useCallback((chinese: string) => {
    const newSavedNames = new Set(savedNames);
    newSavedNames.add(chinese);
    setSavedNames(newSavedNames);
  }, [savedNames]);

  return (
    <div className="space-y-8">
      {/* Generation Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card className="p-8">
          {/* Title and Description */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ✨ Generation Settings
            </h2>
            <p className="text-gray-600 text-lg">
              Customize generation parameters to get the Chinese names you want
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Form Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Gender Field */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Gender
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Style Field */}
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Style
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {styleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Count Field */}
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Count
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Surname Initial Field */}
                <FormField
                  control={form.control}
                  name="surnameInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Surname Initial
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="D"
                          className="h-12 text-center text-lg"
                          maxLength={1}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-16 text-xl bg-violet-600 hover:bg-violet-700"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Names...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      🔄 Generate Names
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </motion.div>

      {/* Generated Names Section */}
      {(isGenerating || generatedNames.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Generated Names ({generatedNames.length})
            </h3>
          </div>

          <Suspense fallback={<LoadingNamesGrid count={parseInt(form.watch('count') || '10')} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Show generated names */}
              {generatedNames.map((name, index) => (
                <motion.div
                  key={`${name.chinese}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <NameCardErrorBoundary>
                    <DetailedNameCard
                      name={name}
                      isSelected={selectedName === name.chinese}
                      isSaved={savedNames.has(name.chinese)}
                      onSelect={() => handleSelectName(name.chinese)}
                      onSave={() => handleSaveName(name.chinese)}
                      gender={form.watch('gender')}
                      style={form.watch('style')}
                    />
                  </NameCardErrorBoundary>
                </motion.div>
              ))}
              
              {/* Show skeleton cards for remaining slots while generating */}
              {isGenerating && Array.from({ 
                length: Math.max(0, parseInt(form.watch('count') || '10') - generatedNames.length) 
              }, (_, index) => (
                <motion.div
                  key={`skeleton-${generatedNames.length + index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <DetailedNameCardSkeleton />
                </motion.div>
              ))}
            </div>
          </Suspense>

          {/* Selected Name Summary */}
          {selectedName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 text-center"
            >
              <div className="text-violet-700 font-medium text-lg">
                🎉 Selected Chinese Name: 
                <span className="font-noto-serif text-2xl font-bold text-violet-800 ml-2">
                  {selectedName}
                </span>
              </div>
            </motion.div>
          )}

          {/* Personalized Generator CTA */}
          {generatedNames.length > 0 && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center"
            >
              <div className="text-blue-700 font-medium text-lg mb-4">
                ✨ Want an even more personalized name?
              </div>
              <p className="text-blue-600 text-sm mb-4">
                Our personalized generator creates names based on your English name, personality traits, and preferences
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Personalized Generator
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {generatedNames.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shuffle className="h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-2xl font-medium text-gray-900 mb-3">
                Ready to Generate Names
              </h3>
              <p className="text-gray-500 text-lg mb-6">
                Choose your preferences above and click "Generate Names" to get started
              </p>
              <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                <div className="text-sm text-violet-700 mb-3">
                  💡 Want a more personalized experience?
                </div>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Try Our Personalized Generator
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}