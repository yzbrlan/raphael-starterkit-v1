"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, MoreHorizontal, Heart } from "lucide-react";
import NameCard from "./name-card";

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

interface NamesGridProps {
  names: NameData[];
  onRegenerate: () => void;
  onBackToForm: () => void;
  isGenerating?: boolean;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (pageIndex: number) => void;
  isAuthenticated?: boolean;
  isLoadingHistory?: boolean;
}

export default function NamesGrid({ 
  names, 
  onRegenerate, 
  onBackToForm, 
  isGenerating,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
  isAuthenticated = false,
  isLoadingHistory = false
}: NamesGridProps) {
  const { toast } = useToast();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [likedNames, setLikedNames] = useState<Set<string>>(new Set());
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());

  const handleLike = (chinese: string) => {
    const newLikedNames = new Set(likedNames);
    if (newLikedNames.has(chinese)) {
      newLikedNames.delete(chinese);
      toast({
        title: "Name unliked",
        description: `You removed ${chinese} from your favorites`,
      });
    } else {
      newLikedNames.add(chinese);
      toast({
        title: "Name liked!",
        description: `You added ${chinese} to your favorites`,
      });
    }
    setLikedNames(newLikedNames);
  };

  const handleShare = (name: NameData) => {
    if (navigator.share) {
      navigator.share({
        title: `My Chinese Name: ${name.chinese}`,
        text: `Check out my Chinese name: ${name.chinese} (${name.pinyin}) - ${name.meaning}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `My Chinese name: ${name.chinese} (${name.pinyin}) - ${name.meaning}`
      ).then(() => {
        toast({
          title: "Copied to clipboard",
          description: `${name.chinese} details copied to your clipboard`,
        });
      }).catch(() => {
        toast({
          title: "Share failed",
          description: "Unable to share at this time",
        });
      });
    }
  };

  const handleComment = (name: NameData) => {
    toast({
      title: "Comment feature",
      description: `Comments for ${name.chinese} coming soon!`,
    });
  };

  const handleSelect = (chinese: string) => {
    setSelectedName(chinese);
    toast({
      title: "Name selected!",
      description: `You selected ${chinese} as your Chinese name`,
    });
  };

  const handleSave = (chinese: string) => {
    const newSavedNames = new Set(savedNames);
    newSavedNames.add(chinese);
    setSavedNames(newSavedNames);
  };

  const handleSaveAllNames = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save names to your collection.",
        variant: "destructive",
      });
      return;
    }

    const savePromises = names.map(async (name) => {
      if (savedNames.has(name.chinese)) return; // Skip already saved names

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
              saved_from: 'batch_save',
              saved_at: new Date().toISOString(),
              page: currentPage
            }
          }),
        });

        if (response.ok) {
          const newSavedNames = new Set(savedNames);
          newSavedNames.add(name.chinese);
          setSavedNames(newSavedNames);
        }
      } catch (error) {
        console.error(`Failed to save ${name.chinese}:`, error);
      }
    });

    const results = await Promise.allSettled(savePromises);
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const alreadySavedCount = names.filter(name => savedNames.has(name.chinese)).length;
    
    if (successCount > 0) {
      toast({
        title: "Names saved!",
        description: `Successfully saved ${successCount} names to your collection.${alreadySavedCount > 0 ? ` ${alreadySavedCount} were already saved.` : ''}`,
      });
    } else if (alreadySavedCount === names.length) {
      toast({
        title: "All names already saved",
        description: "All names in this batch are already in your collection.",
      });
    } else {
      toast({
        title: "Save failed",
        description: "Failed to save names. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-foreground"
        >
          Choose Your Chinese Name
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          {totalPages > 1 && isAuthenticated ? (
            <>
              Generation {currentPage + 1} of {totalPages} - {names.length} unique names. Click on your favorite to select it.
            </>
          ) : (
            <>
              We've generated {names.length} unique names for you. Click on your favorite to select it.
            </>
          )}
        </motion.p>
        
        {/* Pagination indicator for authenticated users with multiple generations */}
        {totalPages > 1 && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Generation {currentPage + 1} of {totalPages}</span>
              {currentPage === 0 && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                  Latest
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <div className="text-xs text-muted-foreground">
                Browse through your generation history using the pagination controls below
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Names Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {names.map((name, index) => (
          <motion.div
            key={name.chinese + index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <NameCard
              name={name}
              isSelected={selectedName === name.chinese}
              isLiked={likedNames.has(name.chinese)}
              isSaved={savedNames.has(name.chinese)}
              onSelect={() => handleSelect(name.chinese)}
              onLike={() => handleLike(name.chinese)}
              onComment={() => handleComment(name)}
              onShare={() => handleShare(name)}
              onSave={() => handleSave(name.chinese)}
            />
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls for authenticated users */}
      {totalPages > 1 && isAuthenticated && onPageChange && (
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0 || isLoadingHistory}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page indicators */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageIndex = i;
                if (totalPages > 5) {
                  if (currentPage <= 2) {
                    pageIndex = i;
                  } else if (currentPage >= totalPages - 3) {
                    pageIndex = totalPages - 5 + i;
                  } else {
                    pageIndex = currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageIndex}
                    variant={currentPage === pageIndex ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageIndex)}
                    disabled={isLoadingHistory}
                    className={`h-8 w-8 p-0 text-xs ${
                      currentPage === pageIndex ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {isLoadingHistory && currentPage === pageIndex ? (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      pageIndex + 1
                    )}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 3 && (
                <>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(totalPages - 1)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || isLoadingHistory}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          onClick={onRegenerate}
          disabled={isGenerating}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            totalPages > 1 && isAuthenticated ? 
              `Generate ${names.length} More Names` : 
              `Generate ${names.length} New Names`
          )}
        </Button>
        
        {/* Save All Names Button for authenticated users */}
        {isAuthenticated && (
          <Button
            onClick={handleSaveAllNames}
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8"
          >
            <Heart className="h-4 w-4 mr-2" />
            Save All to Collection
          </Button>
        )}
        
        <Button
          onClick={onBackToForm}
          variant="outline"
          size="lg"
          className="border-border text-muted-foreground hover:bg-muted px-8"
        >
          Back to Form
        </Button>
      </div>

      {/* Selected name display */}
      {selectedName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="text-center p-6">
              <p className="text-primary font-medium">
                You selected: <span className="font-serif text-xl">{selectedName}</span>
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                This will be your new Chinese name!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}