"use client";

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/styles/concept-map.css';

interface ConceptNode {
  id: string;
  text: string;
  level: number;
  children: ConceptNode[];
  parent?: string;
  keywords?: string[]; // Extract keywords for connection detection
}

interface VisualConceptMapProps {
  conceptMapText: string;
  className?: string;
}

export default function VisualConceptMap({ conceptMapText, className = "" }: VisualConceptMapProps) {
  // Extract keywords from text for connection detection
  const extractKeywords = useCallback((text: string): string[] => {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
      'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
      'its', 'our', 'their'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2 && !commonWords.has(word)) // Filter meaningful words
      .slice(0, 5); // Take top 5 keywords
  }, []);

  // Calculate similarity between two sets of keywords
  const calculateSimilarity = useCallback((keywords1: string[], keywords2: string[]): number => {
    if (!keywords1.length || !keywords2.length) return 0;
    
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }, []);

  // Find conceptual connections between nodes
  const findConceptualConnections = useCallback((allNodes: ConceptNode[]): Edge[] => {
    const connections: Edge[] = [];
    const threshold = 0.05; // Lower threshold to catch more connections

    // Create flat list of all nodes
    const flatNodes: ConceptNode[] = [];
    const collectNodes = (nodes: ConceptNode[]) => {
      nodes.forEach(node => {
        flatNodes.push(node);
        collectNodes(node.children);
      });
    };
    collectNodes(allNodes);

    console.log(`Finding connections between ${flatNodes.length} nodes`);

    // Find connections between nodes at different levels or branches
    for (let i = 0; i < flatNodes.length; i++) {
      for (let j = i + 1; j < flatNodes.length; j++) {
        const node1 = flatNodes[i];
        const node2 = flatNodes[j];

        // Skip if nodes are already connected via hierarchy
        if (node1.parent === node2.id || node2.parent === node1.id) continue;
        if (node1.parent === node2.parent && node1.parent) continue; // Same parent

        // Calculate keyword similarity
        const keywordSimilarity = calculateSimilarity(
          node1.keywords || [],
          node2.keywords || []
        );

        // Check for semantic relationships (contains common patterns)
        const text1 = node1.text.toLowerCase();
        const text2 = node2.text.toLowerCase();
        
        let semanticBonus = 0;
        
        // More comprehensive word matching
        const actionWords = ['process', 'method', 'technique', 'approach', 'strategy', 'system', 'algorithm', 'procedure', 'function', 'operation', 'analysis', 'study', 'research', 'development', 'implementation', 'management', 'control', 'design'];
        const objectWords = ['data', 'information', 'result', 'outcome', 'product', 'output', 'input', 'value', 'content', 'material', 'structure', 'element', 'component', 'feature', 'property', 'characteristic', 'aspect'];
        
        if (actionWords.some(word => text1.includes(word)) && objectWords.some(word => text2.includes(word))) {
          semanticBonus += 0.15;
        }
        if (objectWords.some(word => text1.includes(word)) && actionWords.some(word => text2.includes(word))) {
          semanticBonus += 0.15;
        }
        
        // Check for cause-effect relationships
        const causeWords = ['cause', 'reason', 'factor', 'source', 'origin', 'basis', 'foundation', 'principle', 'rule', 'law', 'theory'];
        const effectWords = ['effect', 'result', 'consequence', 'impact', 'outcome', 'conclusion', 'solution', 'answer', 'response', 'reaction'];
        
        if (causeWords.some(word => text1.includes(word)) && effectWords.some(word => text2.includes(word))) {
          semanticBonus += 0.2;
        }
        if (effectWords.some(word => text1.includes(word)) && causeWords.some(word => text2.includes(word))) {
          semanticBonus += 0.2;
        }
        
        // Check for part-whole relationships
        const partWords = ['part', 'component', 'element', 'aspect', 'feature', 'section', 'portion', 'segment', 'piece', 'unit', 'module'];
        const wholeWords = ['system', 'whole', 'framework', 'structure', 'model', 'organization', 'architecture', 'pattern', 'schema', 'design'];
        
        if (partWords.some(word => text1.includes(word)) && wholeWords.some(word => text2.includes(word))) {
          semanticBonus += 0.15;
        }
        if (wholeWords.some(word => text1.includes(word)) && partWords.some(word => text2.includes(word))) {
          semanticBonus += 0.15;
        }

        // Add bonus for related concepts that appear together
        const relatedPairs = [
          ['learning', 'education'], ['memory', 'recall'], ['practice', 'skill'],
          ['theory', 'application'], ['concept', 'understanding'], ['knowledge', 'information'],
          ['study', 'research'], ['analysis', 'evaluation'], ['problem', 'solution'],
          ['input', 'output'], ['question', 'answer'], ['hypothesis', 'experiment']
        ];

        relatedPairs.forEach(([word1, word2]) => {
          if ((text1.includes(word1) && text2.includes(word2)) || 
              (text1.includes(word2) && text2.includes(word1))) {
            semanticBonus += 0.1;
          }
        });

        const totalSimilarity = keywordSimilarity + semanticBonus;

        if (totalSimilarity > threshold) {
          console.log(`Connection found: "${node1.text}" <-> "${node2.text}" (${totalSimilarity.toFixed(3)})`);
          
          // Determine connection type based on similarity strength
          let connectionType = 'weak';
          let strokeWidth = 1;
          let strokeColor = '#94a3b8'; // slate-400
          
          if (totalSimilarity > 0.3) {
            connectionType = 'strong';
            strokeWidth = 3;
            strokeColor = '#f59e0b'; // amber-500
          } else if (totalSimilarity > 0.15) {
            connectionType = 'medium';
            strokeWidth = 2;
            strokeColor = '#f59e0b'; // amber-500
          }

          connections.push({
            id: `concept-connection-${node1.id}-${node2.id}`,
            source: node1.id,
            target: node2.id,
            type: 'smoothstep',
            style: {
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              strokeDasharray: connectionType === 'weak' ? '5,5' : connectionType === 'medium' ? '8,4' : 'none',
              opacity: 0.8,
            },
            markerEnd: {
              type: MarkerType.Arrow,
              color: strokeColor,
              width: 15,
              height: 15,
            },
            data: {
              similarity: totalSimilarity,
              connectionType: connectionType,
              label: `${Math.round(totalSimilarity * 100)}% related`,
            },
          });
        }
      }
    }

    console.log(`Created ${connections.length} conceptual connections`);
    return connections;
  }, [calculateSimilarity]);
  // Parse the concept map text into a hierarchical structure
  const parseConceptMap = useCallback((text: string): ConceptNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const nodes: ConceptNode[] = [];
    const stack: ConceptNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Determine the level based on indentation and bullet type
      let level = 0;
      let text = trimmed;

      // Remove bullet points and determine hierarchy
      if (trimmed.startsWith('•')) {
        level = 0;
        text = trimmed.replace(/^•\s*/, '');
      } else if (trimmed.startsWith('-')) {
        level = 1;
        text = trimmed.replace(/^-\s*/, '');
      } else if (trimmed.startsWith('*')) {
        level = 2;
        text = trimmed.replace(/^\*\s*/, '');
      } else {
        // Count leading spaces/tabs for indentation
        const leadingSpaces = line.length - line.trimStart().length;
        level = Math.floor(leadingSpaces / 2);
      }

      const node: ConceptNode = {
        id: `node-${index}`,
        text: text,
        level: level,
        children: [],
        keywords: extractKeywords(text), // Add keywords for connection detection
      };

      // Find the parent node
      while (stack.length > level) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        parent.children.push(node);
        node.parent = parent.id;
      } else {
        nodes.push(node);
      }

      stack.push(node);
    });

    return nodes;
  }, [extractKeywords]);

  // Convert hierarchical structure to React Flow nodes and edges
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const conceptNodes = parseConceptMap(conceptMapText);
    const nodes: Node[] = [];
    const hierarchicalEdges: Edge[] = [];
    
    const positions = new Map<number, number>(); // Track positions per level

    const processNode = (conceptNode: ConceptNode, x: number, y: number, siblingIndex: number = 0): void => {
      // Calculate position with better spacing
      const levelSpacing = 280;
      const verticalSpacing = 100;
      
      const levelCount = positions.get(conceptNode.level) || 0;
      positions.set(conceptNode.level, levelCount + 1);

      const nodeX = x + (conceptNode.level * levelSpacing);
      const nodeY = y + (levelCount * verticalSpacing) + (siblingIndex * 40);

      // Create the node with better styling
      const node: Node = {
        id: conceptNode.id,
        type: 'default',
        position: { x: nodeX, y: nodeY },
        data: { 
          label: conceptNode.text,
        },
        style: {
          background: conceptNode.level === 0 ? 'hsl(var(--primary))' : 
                     conceptNode.level === 1 ? 'hsl(var(--accent))' : 
                     'hsl(var(--muted))',
          color: conceptNode.level === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          border: `2px solid ${conceptNode.level === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--border))'}`,
          borderRadius: '12px',
          padding: conceptNode.level === 0 ? '16px' : conceptNode.level === 1 ? '12px' : '8px',
          fontSize: conceptNode.level === 0 ? '16px' : conceptNode.level === 1 ? '14px' : '12px',
          fontWeight: conceptNode.level === 0 ? 'bold' : conceptNode.level === 1 ? '600' : 'normal',
          minWidth: conceptNode.level === 0 ? '200px' : conceptNode.level === 1 ? '160px' : '120px',
          maxWidth: '250px',
          textAlign: 'center',
          boxShadow: conceptNode.level === 0 ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      nodes.push(node);

      // Create hierarchical edge to parent if exists
      if (conceptNode.parent) {
        const edge: Edge = {
          id: `hierarchy-${conceptNode.parent}-${conceptNode.id}`,
          source: conceptNode.parent,
          target: conceptNode.id,
          type: 'smoothstep',
          style: {
            stroke: conceptNode.level === 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            strokeWidth: conceptNode.level === 1 ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: conceptNode.level === 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            width: 20,
            height: 20,
          },
          data: { type: 'hierarchy' },
        };
        hierarchicalEdges.push(edge);
      }

      // Process children with better positioning
      conceptNode.children.forEach((child, index) => {
        const childY = nodeY + ((index - (conceptNode.children.length - 1) / 2) * 80);
        processNode(child, nodeX, childY, index);
      });
    };

    // Process all root nodes with better spacing
    conceptNodes.forEach((rootNode, index) => {
      processNode(rootNode, 50, index * 300);
    });

    // Find conceptual connections between related topics
    const conceptualConnections = findConceptualConnections(conceptNodes);
    
    // Combine hierarchical and conceptual edges
    const allEdges = [...hierarchicalEdges, ...conceptualConnections];

    return { nodes, edges: allEdges };
  }, [conceptMapText, parseConceptMap, findConceptualConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when conceptMapText changes
  useMemo(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  if (!conceptMapText.trim()) {
    return (
      <div className={`flex items-center justify-center h-96 bg-muted/20 border-2 border-dashed border-muted-foreground/25 rounded-lg ${className}`}>
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">No concept map generated yet</div>
          <div className="text-sm text-muted-foreground">Generate a concept map to see the visual representation</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-96 border rounded-lg overflow-hidden ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        attributionPosition="bottom-right"
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        
        {/* Connection Legend */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-10 concept-map-legend opacity-90">
          <div className="text-sm font-medium mb-2">Connection Types</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary"></div>
              <span>Hierarchical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-amber-500"></div>
              <span>Strong Relation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-500"></div>
              <span>Medium Relation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t border-dashed border-slate-400"></div>
              <span>Weak Relation</span>
            </div>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}
