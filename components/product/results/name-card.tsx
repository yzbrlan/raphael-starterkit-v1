"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Share, Eye, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

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

interface NameCardProps {
  name: NameData;
  isSelected: boolean;
  isLiked: boolean;
  isSaved?: boolean;
  onSelect: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave?: () => void;
}

export default function NameCard({ 
  name, 
  isSelected, 
  isLiked, 
  isSaved = false,
  onSelect, 
  onLike, 
  onComment, 
  onShare,
  onSave 
}: NameCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'meaning' | 'characters' | 'cultural'>('meaning');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
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
            saved_from: 'main_generator',
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
  };

  const tabs = [
    { id: 'meaning', label: 'Meaning' },
    { id: 'characters', label: 'Characters' },
    { id: 'cultural', label: 'Cultural Notes' }
  ] as const;

  // Function to truncate text
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Check if text needs truncation
  const needsTruncation = (text: string, maxLength: number = 150) => {
    return text.length > maxLength;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'meaning':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Name Meaning</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isExpanded ? name.meaning : truncateText(name.meaning)}
              </p>
              {needsTruncation(name.meaning) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Why It Suits You</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isExpanded ? name.personalityMatch : truncateText(name.personalityMatch)}
              </p>
              {needsTruncation(name.personalityMatch) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </div>
          </div>
        );

      case 'characters':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground mb-3">Character Breakdown</h4>
            <div className="space-y-3">
              {name.characters.map((char, charIndex) => (
                <div key={char.character} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="font-serif text-lg text-primary w-8 h-8 flex items-center justify-center bg-background rounded border border-border flex-shrink-0">
                    {char.character}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">{char.pinyin}</div>
                    <div className="text-sm font-medium text-foreground mb-1">{char.meaning}</div>
                    {char.explanation && (
                      <div className="text-xs text-muted-foreground">
                        {isExpanded ? char.explanation : truncateText(char.explanation, 80)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {name.characters.some(char => char.explanation && needsTruncation(char.explanation, 80)) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>
        );

      case 'cultural':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground mb-2">Cultural Context</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isExpanded ? name.culturalNotes : truncateText(name.culturalNotes)}
            </p>
            {needsTruncation(name.culturalNotes) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group h-[500px] flex flex-col ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md border-border'
      }`}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1 w-6 h-6 flex items-center justify-center">
            <span className="text-xs font-bold">✓</span>
          </div>
        </div>
      )}

      {/* Style badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
          {name.style}
        </Badge>
      </div>

      {/* Header - Fixed height */}
      <CardHeader className="p-6 pb-4 pt-12 flex-shrink-0">
        <CardTitle className="space-y-2">
          <div className="font-serif text-2xl text-primary min-h-[2rem] flex items-center">
            {name.chinese}
          </div>
          <div className="text-sm text-muted-foreground font-normal min-h-[1.25rem]">
            {name.pinyin}
          </div>
        </CardTitle>
      </CardHeader>

      {/* Tabs - Fixed height */}
      <div className="px-6 flex-shrink-0">
        <div className="flex space-x-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id);
                setIsExpanded(false); // Reset expansion when switching tabs
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area - Expanded height with proper scrolling */}
      <CardContent className="p-6 pt-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Social actions - Fixed at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4 flex-shrink-0">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
            >
              <Heart 
                className={`h-4 w-4 ${
                  isLiked ? 'fill-primary text-primary' : ''
                }`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                isSaved 
                  ? 'text-amber-600 hover:text-amber-700' 
                  : 'text-muted-foreground hover:text-amber-600'
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                onComment();
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-green-500"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 h-8"
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "Detailed View",
                description: "Detailed view feature coming soon!",
              });
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}