"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateConceptMap } from "@/actions/study";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Network, Sparkles, Eye, List } from "lucide-react";
import VisualConceptMap from "./VisualConceptMap";

interface ConceptMapGeneratorProps {
  userId: string;
  subjectId: string;
  noteIds?: string[];
}

export default function ConceptMapGenerator({ userId, subjectId, noteIds }: ConceptMapGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conceptMap, setConceptMap] = useState<string>("");
  const router = useRouter();

  const handleGenerateConceptMap = async () => {
    setIsGenerating(true);
    try {
      const generatedMap = await generateConceptMap(userId, subjectId, noteIds);
      setConceptMap(generatedMap);
      toast.success("Concept map generated successfully!");
      
      // Refresh page to update AI generations count
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Failed to generate concept map");
      console.error("Concept map generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatConceptMap = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('•')) {
        return <div key={index} className="font-semibold text-primary">{trimmedLine}</div>;
      } else if (trimmedLine.startsWith('-')) {
        return <div key={index} className="ml-4 text-foreground">{trimmedLine}</div>;
      } else if (trimmedLine.startsWith('*')) {
        return <div key={index} className="ml-8 text-muted-foreground text-sm">{trimmedLine}</div>;
      } else if (trimmedLine) {
        return <div key={index} className="text-foreground">{trimmedLine}</div>;
      }
      return <div key={index} className="h-2"></div>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Network className="size-4" />
          Concept Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" style={{ width: '90vw' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Concept Map Generator
          </DialogTitle>
          <DialogDescription>
            Generate a visual concept map to understand relationships between topics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!conceptMap ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a concept map that shows the relationships between key concepts in your study material.
                This will help you visualize how different topics connect to each other.
              </p>
              <Button 
                onClick={handleGenerateConceptMap} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? "Generating Concept Map..." : "Generate Concept Map"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Visual Map
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <List className="size-4" />
                    Text Outline
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Interactive Concept Map</CardTitle>
                      <CardDescription>
                        Drag nodes to reorganize • Zoom and pan to explore • Click controls for options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VisualConceptMap conceptMapText={conceptMap} className="h-[600px]" />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Concept Map Outline</CardTitle>
                      <CardDescription>
                        Hierarchical text representation of concepts and relationships
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                        {formatConceptMap(conceptMap)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-center gap-2">
                <Button 
                  onClick={() => setConceptMap("")} 
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="size-4" />
                  Generate New Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 